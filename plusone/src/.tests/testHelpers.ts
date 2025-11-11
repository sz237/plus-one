import axios from 'axios';

export const mockAxios = () => {
  const ax = axios as jest.Mocked<typeof axios>;

  // For files using axios.create(...)
  const instance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  } as any;

  ax.create.mockReturnValue(instance);

  // For files using axios directly (no create)
  ax.get.mockReset();
  ax.post.mockReset();
  ax.put.mockReset();
  ax.delete.mockReset();

  return { ax, instance };
};