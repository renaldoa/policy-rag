from fastapi import HTTPException, status


class DocumentNotFoundError(HTTPException):
    def __init__(self, document_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {document_id} not found",
        )


class DocumentProcessingError(HTTPException):
    def __init__(self, message: str):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document processing failed: {message}",
        )


class UnsupportedFileTypeError(HTTPException):
    def __init__(self, file_type: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file_type}. Supported types: pdf, docx, txt",
        )


class SearchError(HTTPException):
    def __init__(self, message: str):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {message}",
        )


class EmbeddingError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)


class QdrantConnectionError(Exception):
    def __init__(self, message: str = "Failed to connect to Qdrant"):
        self.message = message
        super().__init__(self.message)
