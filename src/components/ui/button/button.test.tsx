import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles loading state correctly', () => {
    render(<Button isLoading loadingText="Loading...">Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Loading...');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });

  it('handles async click events with success', async () => {
    const onClickMock = jest.fn().mockResolvedValue(undefined);
    render(<Button onClick={onClickMock}>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-busy', 'true');
    await waitFor(() => {
      expect(onClickMock).toHaveBeenCalledTimes(1);
      expect(button).toHaveAttribute('aria-busy', 'false');
    });
  });

  it('handles async click events with error', async () => {
    const onClickMock = jest.fn().mockRejectedValue(new Error('Failed'));
    render(<Button onClick={onClickMock}>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onClickMock).toHaveBeenCalledTimes(1);
      expect(button).toHaveAttribute('aria-busy', 'false');
      expect(button).toHaveClass('bg-destructive');
    });
  });

  it('prevents multiple clicks while processing', async () => {
    const onClickMock = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<Button onClick={onClickMock}>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(onClickMock).toHaveBeenCalledTimes(1);
    });
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="default">Default</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary');

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-input');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="default">Default</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10');

    rerender(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-9');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-11');
  });

  it('handles icon positioning correctly', () => {
    const icon = <span data-testid="icon">Icon</span>;
    
    const { rerender } = render(
      <Button icon={icon} iconPosition="left">
        Text
      </Button>
    );
    
    let iconElement = screen.getByTestId('icon');
    expect(iconElement.parentElement).toHaveClass('mr-2');

    rerender(
      <Button icon={icon} iconPosition="right">
        Text
      </Button>
    );
    
    iconElement = screen.getByTestId('icon');
    expect(iconElement.parentElement).toHaveClass('ml-2');
  });
});
