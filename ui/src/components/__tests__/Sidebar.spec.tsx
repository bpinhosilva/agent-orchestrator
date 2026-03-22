import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';

describe('Sidebar Component', () => {
  it('renders the brand title', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>,
    );
    expect(screen.getByText(/ORCHESTRATOR/i)).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>,
    );
    expect(screen.getByText(/Agents/i)).toBeInTheDocument();
    expect(screen.getByText(/Task Manager/i)).toBeInTheDocument();
  });
});
