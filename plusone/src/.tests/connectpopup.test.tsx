import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ConnectPopup from '@/components/ConnectPopup';

const createMock = jest.fn();
jest.mock('@/services/connectionService', () => ({
  connectionService: {
    createConnectionRequest: (...args: any[]) => createMock(...args),
  },
}));

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  targetUser: { userId: 'u2', firstName: 'Grace', lastName: 'Hopper' },
  currentUserId: 'u1',
  onSuccess: jest.fn(),
};

describe('ConnectPopup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires a message', async () => {
    render(<ConnectPopup {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /send request/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/message is required/i);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('submits successfully and closes', async () => {
    createMock.mockResolvedValueOnce({});
    render(<ConnectPopup {...baseProps} />);

    fireEvent.change(screen.getByRole('textbox', { name: /why do you want to connect/i }), {
      target: { value: 'Hi!' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send request/i }));
    });

    expect(createMock).toHaveBeenCalledWith('u1', {
      toUserId: 'u2',
      message: 'Hi!',
    });
    expect(baseProps.onSuccess).toHaveBeenCalled();
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('handles backend error', async () => {
    createMock.mockRejectedValueOnce({ response: { data: { message: 'Nope' } } });
    render(<ConnectPopup {...baseProps} />);

    fireEvent.change(screen.getByRole('textbox', { name: /why do you want to connect/i }), {
      target: { value: 'Hi!' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /send request/i }));
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(/nope/i);
  });

  it('cancel closes and clears state', () => {
    render(<ConnectPopup {...baseProps} />);

    fireEvent.change(screen.getByRole('textbox', { name: /why do you want to connect/i }), {
      target: { value: 'Hi!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(baseProps.onClose).toHaveBeenCalled();
  });
});
