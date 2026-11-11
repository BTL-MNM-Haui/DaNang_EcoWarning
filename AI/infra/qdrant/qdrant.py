from __future__ import annotations

import logging
import uuid
from typing import Any
from typing import Dict
from typing import List

from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.models import Distance
from shared.base import BaseModel
from shared.base import BaseService
from shared.settings import Settings
from shared.sparse_emb import SparseEmbeddingData

logger = logging.getLogger(__name__)


class QdrantInput(BaseModel):
    dense_embeddings: List[List[float]]
    sparse_embeddings: List[SparseEmbeddingData]
    payload: List[Dict[str, Any]]


class Qdrant(BaseService):
    settings: Settings

    @property
    def client(self) -> QdrantClient:
        try:
            client_kwargs = {
                'url': self.settings.qdrant.url,
                'port': self.settings.qdrant.port,
            }
            logger.info('Connected to Qdrant successfully.')
            return QdrantClient(**client_kwargs)
        except Exception as e:
            logger.error(f'Failed to connect to Qdrant: {e}')
            raise

    @property
    def setup_collection(self):
        collection_name = self.settings.qdrant.name
        try:
            if not self.client.collection_exists(collection_name):
                self.client.create_collection(
                    collection_name=collection_name,
                    vectors_config={
                        'dense': models.VectorParams(
                            size=self.settings.qdrant.vector_size,
                            distance=Distance.COSINE,
                        ),
                    },
                    sparse_vectors_config={
                        'sparse': models.SparseVectorParams(),
                    },
                )
                logger.info(f'Created Qdrant collection: {collection_name}')
        except Exception as e:
            logger.error(f'Error setting up Qdrant collection: {e}')

        return self.client.get_collection(collection_name)

    def insert(self, inputs: QdrantInput):
        """ Insert points into Qdrant collection with error handling.

        Args:
            inputs (QdrantInput): Input data containing embeddings and payloads.
        """
        try:
            collection_name = self.settings.qdrant.name

            points = [
                models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector={
                        'dense': inputs.dense_embeddings[i],
                        'sparse': models.SparseVector(
                            indices=inputs.sparse_embeddings[i].indices,
                            values=inputs.sparse_embeddings[i].values,
                        ),
                    },
                    payload=inputs.payload[i],
                )
                for i in range(len(inputs.dense_embeddings))
            ]

            self.client.upsert(
                collection_name=collection_name,
                points=points,
                wait=True,
            )
            logger.info(
                f"Inserted {len(points)} points into Qdrant collection '{collection_name}'.",
            )

        except Exception as e:
            logger.error(
                f'Error inserting points into Qdrant: {e}', exc_info=True,
            )

    def query(self, dense_query: List[float], sparse_query: List[SparseEmbeddingData], k: int):
        """ Query Qdrant with hybrid dense + sparse embeddings using RRF.

        Args:
            dense_query (List[float]): _dense embedding query vector.
            sparse_query (List[SparseEmbeddingData]): _sparse embedding query vector.
            user_name (str): _user name to filter results.
            k (int): _number of top results to return.

        Returns:
            _type_: _list of query results from Qdrant.
        """
        try:
            collection_name = self.settings.qdrant.name

            sparse_vec = models.SparseVector(
                indices=sparse_query[0].indices,
                values=sparse_query[0].values,
            )

            rrf_query = models.FusionQuery(
                fusion=models.Fusion.RRF,
                prefetch=[
                    models.Prefetch(
                        query=dense_query,
                        using='dense',
                        limit=20,
                    ),
                    models.Prefetch(
                        query=sparse_vec,
                        using='sparse',
                        limit=20,
                    ),
                ],
            )

            return self.client.query_points(
                collection_name=collection_name,
                query=rrf_query,
                with_payload=True,
                limit=k,
            )

        except Exception as e:
            logging.error(f'Error querying Qdrant: {e}', exc_info=True)
            return []

    def process(self):
        pass
