from __future__ import annotations

import logging
from typing import Any
from typing import Dict
from typing import List

from langchain_core.documents import Document
from langchain_text_splitters import MarkdownHeaderTextSplitter
from langchain_text_splitters import RecursiveCharacterTextSplitter
from markitdown import MarkItDown
from markitdown import MarkItDownException
from shared.base import BaseModel
from shared.base import BaseService
from shared.settings import Settings

logger = logging.getLogger(__name__)


class ChunkingInput(BaseModel):
    path: str


class ChunkingOutput(BaseModel):
    chunks: List[Dict[str, Any]]


class ChunkingService(BaseService):
    settings: Settings

    def convert_to_markdown(self, path: str) -> str:
        """ Convert a file to markdown format.

        Args:
            path (str): Path to the file to be converted.

        Returns:
            str: Markdown content as a string.
        """
        try:
            md_converter = MarkItDown()
            markdown_content = md_converter.convert(path)
            return markdown_content.markdown
        except MarkItDownException as e:
            logger.error(f'Error converting file to markdown: {e}')
            raise

    def _get_markdown_headers(self, markdown_content: str) -> list[Document]:
        """Get the headers from the Markdown text.

        Args:
            markdown_content (str): Markdown text.

        Returns:
            list[str]: List of headers.
        """
        header_splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=[
                ('#', 'Header_1'),
                ('##', 'Header_2'),
                ('###', 'Header_3'),
            ],
        )
        return header_splitter.split_text(markdown_content)

    def _chunk_table(self, table_content: str, metadata: dict) -> List[Document]:
        """ Chunk a markdown table into smaller chunks, each containing one data row.

        Args:
            table_content (str): Markdown table content as a string.
            metadata (dict): Metadata to be copied to each chunk.

        Returns:
            List[Document]: List of Document objects, each representing a chunked table row.
        """
        table_chunks = []
        lines = table_content.strip().split('\n')

        if len(lines) < 2:
            return [Document(page_content=table_content, metadata=metadata)]

        header_row = lines[0]
        separator_row = lines[1]
        if not (header_row.strip().startswith('|') and separator_row.strip().startswith('|') and '---' in separator_row):
            return [Document(page_content=table_content, metadata=metadata)]

        for data_row in lines[2:]:
            data_row = data_row.strip()
            if not data_row:
                continue

            chunk_content = f'{header_row}\n{separator_row}\n{data_row}'

            new_doc = Document(
                page_content=chunk_content,
                metadata=metadata.copy(),
            )
            table_chunks.append(new_doc)

        return table_chunks

    def process(self, inputs: ChunkingInput) -> ChunkingOutput:
        """ Process the input file and chunk its content.

        Args:
            inputs (ChunkingInput): Input data containing the file path.

        Returns:
            ChunkingOutput: Output data containing the list of chunked content.
        """
        markdown_content = self.convert_to_markdown(inputs.path)

        header_chunks = self._get_markdown_headers(markdown_content)

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.settings.chunking.size,
            chunk_overlap=self.settings.chunking.overlap,
            separators=['\n\n', '\n', ' ', ''],
        )

        final_chunks = []

        for doc in header_chunks:
            content = doc.page_content.strip()

            if content.startswith('|') and '\n|' in content:
                table_chunks = self._chunk_table(content, doc.metadata)
                final_chunks.extend(table_chunks)
            else:
                sub_chunks = text_splitter.split_documents([doc])
                final_chunks.extend(sub_chunks)

        output_chunks_list = []
        for i, doc in enumerate(final_chunks):
            # Thêm đường dẫn file và ID duy nhất vào metadata
            doc.metadata['path'] = inputs.path
            doc.metadata['chunk_id'] = f'{inputs.path}_{i}'

            output_chunks_list.append({
                'page_content': doc.page_content,
                'metadata': doc.metadata,
            })

        return ChunkingOutput(chunks=output_chunks_list)
