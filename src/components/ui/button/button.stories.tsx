import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { Mail } from 'lucide-react';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Base button
export const Default: Story = {
  args: {
    children: 'Button',
  },
};

// Variants
export const Primary: Story = {
  args: {
    variant: 'default',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
  },
};

// Sizes
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

// States
export const Loading: Story = {
  args: {
    isLoading: true,
    loadingText: 'Loading...',
    children: 'Submit',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

// With Icon
export const WithLeftIcon: Story = {
  args: {
    children: 'Send Email',
    icon: <Mail className="w-4 h-4" />,
    iconPosition: 'left',
  },
};

export const WithRightIcon: Story = {
  args: {
    children: 'Send Email',
    icon: <Mail className="w-4 h-4" />,
    iconPosition: 'right',
  },
};

// Interactive Examples
export const AsyncSuccess: Story = {
  args: {
    children: 'Save Changes',
    onClick: () => new Promise((resolve) => setTimeout(resolve, 2000)),
    loadingText: 'Saving...',
  },
};

export const AsyncError: Story = {
  args: {
    children: 'Trigger Error',
    onClick: () => new Promise((_, reject) => setTimeout(() => reject(new Error('Failed')), 2000)),
    loadingText: 'Processing...',
  },
};
