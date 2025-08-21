import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders welcome message', () => {
    render(<App />);
    expect(screen.getByText('Smart Helpdesk')).toBeInTheDocument();
    expect(screen.getByText('Welcome to Smart Helpdesk')).toBeInTheDocument();
  });
});