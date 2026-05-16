import pytest
import io
import sys
import os

# Add parent directory to path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from unittest.mock import patch

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_detect_no_frame(client):
    """Test that the API rejects requests without a frame"""
    response = client.post('/detect')
    assert response.status_code == 400
    assert b"NO fream provided" in response.data

@patch('app.process_frame_task.delay')
def test_detect_with_frame(mock_delay, client):
    """Test that the API accepts a frame and queues it to Celery"""
    # Create a dummy image file in memory
    dummy_image = (b"dummy_image_data")
    data = {
        'frame': (io.BytesIO(dummy_image), 'test.jpg')
    }
    
    response = client.post('/detect', data=data, content_type='multipart/form-data')
    
    # Check that it returned 202 Accepted and status 'queued'
    assert response.status_code == 202
    assert response.json['status'] == 'queued'
    
    # Check that the Celery task was called
    mock_delay.assert_called_once()
