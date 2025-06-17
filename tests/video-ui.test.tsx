/**
 * Video UI Components Tests
 * 
 * Tests for VideoPlayer, VideoUploadManager, and related UI components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach } from '@jest/testing-library/jest';
import { VideoPlayer } from '../src/components/VideoPlayer/VideoPlayer';
import { VideoUploadManager } from '../src/components/VideoUpload/VideoUploadManager';
import { ThumbnailPreview } from '../src/components/VideoPlayer/ThumbnailPreview';

// Mock the video service
jest.mock('../src/services/videoService', () => ({
  uploadGameVideo: jest.fn(),
  getVideoSources: jest.fn(),
  checkProcessingStatus: jest.fn(),
}));

// Mock the video processing hook
jest.mock('../src/hooks/useVideoProcessing', () => ({
  useVideoProcessing: () => ({
    isUploading: false,
    uploadProgress: 0,
    uploadError: null,
    processingStatus: null,
    videoSources: null,
    thumbnails: null,
    uploadVideo: jest.fn(),
    refreshVideoData: jest.fn(),
    startPolling: jest.fn(),
    stopPolling: jest.fn(),
  })
}));

describe('VideoPlayer Component', () => {
  const mockVideoSources = {
    original: 'https://example.com/original.mp4',
    '1080p': 'https://example.com/1080p.mp4',
    '720p': 'https://example.com/720p.mp4'
  };

  const mockThumbnails = [
    'https://example.com/thumb1.jpg',
    'https://example.com/thumb2.jpg',
    'https://example.com/thumb3.jpg'
  ];

  test('renders video player with quality selector', () => {
    render(
      <VideoPlayer
        videoSources={mockVideoSources}
        thumbnails={mockThumbnails}
        onTimeUpdate={() => {}}
      />
    );

    // Check if video element is rendered
    const videoElement = screen.getByRole('img'); // video elements often have img role in testing
    expect(videoElement).toBeInTheDocument();

    // Check if quality selector is rendered
    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(screen.getByText('1080p')).toBeInTheDocument();
    expect(screen.getByText('720p')).toBeInTheDocument();
    expect(screen.getByText('Original')).toBeInTheDocument();
  });

  test('shows processing status when video is being processed', () => {
    render(
      <VideoPlayer
        videoSources={mockVideoSources}
        processingStatus="PROCESSING"
        onTimeUpdate={() => {}}
      />
    );

    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });

  test('quality selector changes video source', async () => {
    const mockOnTimeUpdate = jest.fn();
    
    render(
      <VideoPlayer
        videoSources={mockVideoSources}
        onTimeUpdate={mockOnTimeUpdate}
      />
    );

    // Click on 720p quality option
    const quality720p = screen.getByText('720p');
    fireEvent.click(quality720p);

    // Verify the video source would change (in a real scenario)
    await waitFor(() => {
      expect(quality720p).toHaveClass('selected'); // Assuming selected class exists
    });
  });

  test('handles missing video sources gracefully', () => {
    render(
      <VideoPlayer
        videoSources={{}}
        onTimeUpdate={() => {}}
      />
    );

    // Should render without crashing
    expect(screen.getByText(/no video available/i)).toBeInTheDocument();
  });
});

describe('ThumbnailPreview Component', () => {
  const mockThumbnails = [
    'https://example.com/thumb1.jpg',
    'https://example.com/thumb2.jpg',
    'https://example.com/thumb3.jpg'
  ];

  test('renders thumbnail grid', () => {
    const mockOnClick = jest.fn();
    
    render(
      <ThumbnailPreview
        thumbnails={mockThumbnails}
        onThumbnailClick={mockOnClick}
      />
    );

    // Check if thumbnails are rendered
    const thumbnailImages = screen.getAllByRole('img');
    expect(thumbnailImages).toHaveLength(3);
  });

  test('calls onThumbnailClick when thumbnail is clicked', () => {
    const mockOnClick = jest.fn();
    
    render(
      <ThumbnailPreview
        thumbnails={mockThumbnails}
        onThumbnailClick={mockOnClick}
      />
    );

    // Click first thumbnail
    const firstThumbnail = screen.getAllByRole('img')[0];
    fireEvent.click(firstThumbnail);

    expect(mockOnClick).toHaveBeenCalledWith(0);
  });

  test('handles empty thumbnails array', () => {
    render(
      <ThumbnailPreview
        thumbnails={[]}
        onThumbnailClick={() => {}}
      />
    );

    expect(screen.getByText(/no thumbnails available/i)).toBeInTheDocument();
  });
});

describe('VideoUploadManager Component', () => {
  const mockProps = {
    gameId: 'test-game-123',
    onVideoUploaded: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders upload area when no video exists', () => {
    render(<VideoUploadManager {...mockProps} />);

    expect(screen.getByText('Upload Game Video')).toBeInTheDocument();
    expect(screen.getByText('Choose Video File')).toBeInTheDocument();
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });

  test('shows supported file formats and size limit', () => {
    render(<VideoUploadManager {...mockProps} />);

    expect(screen.getByText(/supported formats/i)).toBeInTheDocument();
    expect(screen.getByText(/MP4, MOV, AVI, MKV/i)).toBeInTheDocument();
    expect(screen.getByText(/maximum file size: 5GB/i)).toBeInTheDocument();
  });

  test('handles file input change', async () => {
    render(<VideoUploadManager {...mockProps} />);

    const fileInput = screen.getByRole('button', { name: /choose video file/i });
    const mockFile = new File(['mock video content'], 'test-video.mp4', {
      type: 'video/mp4'
    });

    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // Verify that upload process would begin
    await waitFor(() => {
      // In a real test, we'd verify the upload hook was called
      expect(mockProps.onVideoUploaded).toHaveBeenCalled();
    });
  });

  test('shows drag and drop visual feedback', () => {
    render(<VideoUploadManager {...mockProps} />);

    const dropZone = screen.getByText(/drag and drop/i).closest('div');
    
    // Simulate drag over
    fireEvent.dragOver(dropZone, {
      dataTransfer: {
        files: [new File([''], 'test.mp4', { type: 'video/mp4' })]
      }
    });

    // Verify visual feedback (border color change)
    expect(dropZone).toHaveClass('border-yellow-500');
  });

  test('prevents non-video files from being uploaded', async () => {
    // Mock window.alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<VideoUploadManager {...mockProps} />);

    const fileInput = screen.getByRole('button', { name: /choose video file/i });
    const mockTextFile = new File(['text content'], 'test.txt', {
      type: 'text/plain'
    });

    fireEvent.change(fileInput, { target: { files: [mockTextFile] } });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Please select a video file');
    });

    alertSpy.mockRestore();
  });

  test('shows processing pipeline status', () => {
    // Mock the hook to return processing status
    const mockUseVideoProcessing = require('../src/hooks/useVideoProcessing').useVideoProcessing;
    mockUseVideoProcessing.mockReturnValue({
      isUploading: false,
      uploadProgress: 0,
      uploadError: null,
      processingStatus: 'PROCESSING',
      videoSources: null,
      thumbnails: null,
      uploadVideo: jest.fn(),
      refreshVideoData: jest.fn(),
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
    });

    render(<VideoUploadManager {...mockProps} />);

    expect(screen.getByText('Video Processing Pipeline')).toBeInTheDocument();
    expect(screen.getByText(/process multiple quality versions/i)).toBeInTheDocument();
    expect(screen.getByText(/generate video thumbnails/i)).toBeInTheDocument();
  });

  test('shows upload progress bar during upload', () => {
    // Mock uploading state
    const mockUseVideoProcessing = require('../src/hooks/useVideoProcessing').useVideoProcessing;
    mockUseVideoProcessing.mockReturnValue({
      isUploading: true,
      uploadProgress: 45,
      uploadError: null,
      processingStatus: null,
      videoSources: null,
      thumbnails: null,
      uploadVideo: jest.fn(),
      refreshVideoData: jest.fn(),
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
    });

    render(<VideoUploadManager {...mockProps} />);

    expect(screen.getByText('Uploading... 45%')).toBeInTheDocument();
    
    // Check if progress bar is rendered
    const progressBar = screen.getByRole('progressbar'); // Assuming progress bar has this role
    expect(progressBar).toHaveStyle('width: 45%');
  });

  test('displays error message when upload fails', () => {
    // Mock error state
    const mockUseVideoProcessing = require('../src/hooks/useVideoProcessing').useVideoProcessing;
    mockUseVideoProcessing.mockReturnValue({
      isUploading: false,
      uploadProgress: 0,
      uploadError: 'Network connection failed',
      processingStatus: null,
      videoSources: null,
      thumbnails: null,
      uploadVideo: jest.fn(),
      refreshVideoData: jest.fn(),
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
    });

    render(<VideoUploadManager {...mockProps} />);

    expect(screen.getByText('Upload Failed')).toBeInTheDocument();
    expect(screen.getByText('Network connection failed')).toBeInTheDocument();
  });
});