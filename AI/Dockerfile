FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1

WORKDIR /app
COPY requirements.txt /app/AI/requirements.txt
RUN pip install --no-cache-dir -r /app/AI/requirements.txt \
    && useradd --create-home --uid 10001 ai
COPY --chown=ai:ai . /app/AI
RUN python AI/tools/export_notebook_evaluation.py
USER ai
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health/ready', timeout=3)"
CMD ["uvicorn", "AI.server:app", "--host", "0.0.0.0", "--port", "8000"]
