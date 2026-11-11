from __future__ import annotations

import logging
from functools import cached_property
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple

from FlagEmbedding import BGEM3FlagModel
from shared.base import BaseModel
from shared.base import BaseService
from shared.settings import Settings
from shared.sparse_emb import SparseEmbeddingData

logger = logging.getLogger(__name__)


class EmbeddingInput(BaseModel):
    chunks: List[Dict[str, Any]]
    query: Optional[str] = None


class EmbeddingOutput(BaseModel):
    dense_embeddings: List[List[float]]
    sparse_embeddings: List[SparseEmbeddingData]
    metadata: List[Dict[str, Any]]


class EmbeddingService(BaseService):
    settings: Settings

    @cached_property
    def load_bge_model(self) -> BGEM3FlagModel:
        """
        Load the BGE-M3 model for hybrid dense + sparse embeddings.
        """
        model_path = self.settings.embedding.model_name
        logger.info(f'Loading BGE-M3 hybrid model from {model_path}')
        return BGEM3FlagModel(model_name_or_path=model_path)

    def _get_bge_embeddings(self, texts: List[str]) -> Tuple[List[List[float]], List[SparseEmbeddingData]]:
        """ Generate both dense and sparse embeddings using the BGE-M3 model.

        Args:
            texts (List[str]): List of input texts to encode.
        """
        if not texts:
            return [], []

        valid_texts = [t for t in texts if t and isinstance(t, str)]
        if not valid_texts:
            logger.warning('No valid texts to encode.')
            return [], []

        try:
            results = self.load_bge_model.encode(valid_texts)
            dense_vecs = results['dense_vecs'].tolist()
            sparse_vecs = results['lexical_weights']
            sparse_data = []

            for sparse in sparse_vecs:
                indices = list(sparse.keys())
                values = list(sparse.values())
                sparse_data.append(
                    SparseEmbeddingData(
                        indices=indices, values=values,
                    ),
                )

            return dense_vecs, sparse_data
        except Exception as e:
            logger.error(f'Error generating BGE embeddings: {str(e)}')
            return [], []

    def process(self, inputs: EmbeddingInput) -> EmbeddingOutput:
        """ Process the input to generate embeddings.

        Args:
            inputs (EmbeddingInput): Input data containing chunks or a query.

        Returns:
            EmbeddingOutput: Output data containing dense and sparse embeddings along with metadata.
        """
        if not inputs.chunks and not inputs.query:
            return EmbeddingOutput(dense_embeddings=[], sparse_embeddings=[], metadata=[])

        # Case: Query embedding
        if inputs.query:
            dense, sparse = self._get_bge_embeddings([inputs.query])
            return EmbeddingOutput(
                dense_embeddings=dense,
                sparse_embeddings=sparse,
                metadata=[],
            )

        # Case: Chunk embeddings
        if inputs.chunks:
            valid_chunks = [
                c for c in inputs.chunks if 'page_content' in c and isinstance(
                    c['page_content'], str,
                )
            ]
            if not valid_chunks:
                logger.warning('No valid chunks to encode.')
                return EmbeddingOutput(dense_embeddings=[], sparse_embeddings=[], metadata=[])

            texts = [c['page_content'] for c in valid_chunks]
            dense_embeddings, sparse_embeddings = self._get_bge_embeddings(
                texts,
            )

            metadata = [
                {
                    **chunk.get('metadata', {}),
                    'page_content': chunk['page_content'],
                }
                for chunk in valid_chunks
            ]

            return EmbeddingOutput(
                dense_embeddings=dense_embeddings,
                sparse_embeddings=sparse_embeddings,
                metadata=metadata,
            )
        return EmbeddingOutput(dense_embeddings=[], sparse_embeddings=[], metadata=[])
