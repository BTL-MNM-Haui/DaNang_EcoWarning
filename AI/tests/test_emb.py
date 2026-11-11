from __future__ import annotations

import unittest

from domain.indexing import EmbeddingInput
from domain.indexing import EmbeddingService
from shared.settings import Settings


class TestChunkingService(unittest.TestCase):

    def setUp(self):
        self.settings = Settings()
        self.chunking_service = EmbeddingService(settings=self.settings)

    def test_chunking(self):
        # Test with a sample markdown content
        inputs = EmbeddingInput(
            chunks=[
                {
                    'page_content': '| Phân theo | Phân loại | Đơn vị tính | Năm 2018 | Năm 2020 | Năm 2021 | Sơ bộ 2022 |\n| --- | --- | --- | --- | --- | --- | --- |\n| Thiệt hại về người | Số người chết và mất tích | Người | NaN | 5.00 | NaN | 5.000 |',
                    'metadata': {'Header_2': 'thiet_hai_do_thien_tai_17611061', 'path': '/home/chien/open_data/thien_tai/thiet_hai_do_thien_tai.xlsx', 'chunk_id': '/home/chien/open_data/thien_tai/thiet_hai_do_thien_tai.xlsx_0'},
                },
            ],
        )
        result = self.chunking_service.process(
            inputs=inputs,
        )
        print(result)


if __name__ == '__main__':
    unittest.main()
