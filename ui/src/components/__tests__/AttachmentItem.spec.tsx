import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AttachmentItem from '../tasks/AttachmentItem';

describe('AttachmentItem', () => {
  beforeEach(() => {
    vi.stubGlobal('open', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ---------------------------------------------------------------------------
  // URL construction
  // ---------------------------------------------------------------------------

  describe('artifact URL construction', () => {
    it('uses an absolute URL as-is', () => {
      render(
        <AttachmentItem
          name="file.png"
          type="png"
          filePath="https://cdn.example.com/file.png"
        />,
      );
      // clicking opens the original URL
      const item = screen.getByRole('img');
      expect(item).toHaveAttribute('src', 'https://cdn.example.com/file.png');
    });

    it('prepends /api/v1/ for legacy uploads/ paths', () => {
      render(
        <AttachmentItem
          name="file.png"
          type="png"
          filePath="uploads/artifacts/old-uuid.png"
        />,
      );
      expect(screen.getByRole('img')).toHaveAttribute(
        'src',
        '/api/v1/uploads/artifacts/old-uuid.png',
      );
    });

    it('prepends /api/v1/uploads/artifacts/ for new hierarchical paths', () => {
      render(
        <AttachmentItem
          name="photo.png"
          type="png"
          filePath="2024/01/15/task-abc/uuid.png"
        />,
      );
      expect(screen.getByRole('img')).toHaveAttribute(
        'src',
        '/api/v1/uploads/artifacts/2024/01/15/task-abc/uuid.png',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    it('shows the file name', () => {
      render(
        <AttachmentItem name="report.pdf" type="pdf" filePath="2024/01/15/id/uuid.pdf" />,
      );
      expect(screen.getByText('report.pdf')).toBeInTheDocument();
    });

    it('renders an <img> for image types', () => {
      render(
        <AttachmentItem name="photo.png" type="png" filePath="2024/01/15/id/uuid.png" />,
      );
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('renders a file icon (no <img>) for non-image types', () => {
      render(
        <AttachmentItem name="doc.pdf" type="pdf" filePath="2024/01/15/id/uuid.pdf" />,
      );
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('shows the optional size label', () => {
      render(
        <AttachmentItem
          name="file.txt"
          type="txt"
          size="42 KB"
          filePath="2024/01/15/id/uuid.txt"
        />,
      );
      expect(screen.getByText('42 KB')).toBeInTheDocument();
    });

    it('falls back to "Artifact" when size is omitted', () => {
      render(
        <AttachmentItem name="file.txt" type="txt" filePath="2024/01/15/id/uuid.txt" />,
      );
      expect(screen.getByText('Artifact')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Interaction
  // ---------------------------------------------------------------------------

  describe('interactions', () => {
    it('opens the artifact URL in a new tab on click', async () => {
      render(
        <AttachmentItem
          name="photo.png"
          type="png"
          filePath="2024/01/15/task-abc/uuid.png"
        />,
      );

      await userEvent.click(screen.getByText('photo.png'));

      expect(window.open).toHaveBeenCalledWith(
        '/api/v1/uploads/artifacts/2024/01/15/task-abc/uuid.png',
        '_blank',
      );
    });
  });
});
