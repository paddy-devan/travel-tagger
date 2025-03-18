import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /Click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-blue-600'); // primary variant
  });

  it('renders with secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button', { name: /Secondary/i });
    expect(button).toHaveClass('bg-gray-100');
  });

  it('renders with outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole('button', { name: /Outline/i });
    expect(button).toHaveClass('border-gray-300');
  });

  it('renders with ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole('button', { name: /Ghost/i });
    expect(button).toHaveClass('bg-transparent');
  });

  it('renders with different sizes', () => {
    render(<Button size="sm">Small</Button>);
    const smallButton = screen.getByRole('button', { name: /Small/i });
    expect(smallButton).toHaveClass('h-8');

    render(<Button size="lg">Large</Button>);
    const largeButton = screen.getByRole('button', { name: /Large/i });
    expect(largeButton).toHaveClass('h-12');
  });

  it('renders with loading state', () => {
    render(<Button isLoading>Loading</Button>);
    const button = screen.getByRole('button', { name: /Loading/i });
    expect(button).toBeDisabled();
    expect(screen.getByText('Loading')).toBeInTheDocument();
    expect(button.querySelector('svg')).toBeInTheDocument(); // Loading spinner
  });

  it('renders with full width', () => {
    render(<Button fullWidth>Full Width</Button>);
    const button = screen.getByRole('button', { name: /Full Width/i });
    expect(button).toHaveClass('w-full');
  });

  it('passes additional props to the button element', () => {
    render(<Button data-testid="test-button">Test Props</Button>);
    const button = screen.getByTestId('test-button');
    expect(button).toBeInTheDocument();
  });
}); 