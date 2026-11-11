from __future__ import annotations

import unittest

from domain.indexing import ChunkingInput
from domain.indexing import ChunkingService
from shared.settings import Settings


class TestChunkingService(unittest.TestCase):

    def setUp(self):
        self.settings = Settings()
        self.chunking_service = ChunkingService(settings=self.settings)

    def test_chunking(self):
        # Test with a sample markdown content
        inputs = ChunkingInput(
            path='/home/chien/open_data/thien_tai/thiet_hai_do_thien_tai.xlsx',
        )
        result = self.chunking_service.process(
            inputs=inputs,
        )
        print(result)


if __name__ == '__main__':
    unittest.main()
