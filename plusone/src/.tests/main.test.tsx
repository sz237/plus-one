import React from 'react';
import * as ReactDOMClient from 'react-dom/client';

// Mock CSS/JS that main.tsx imports so they don't do anything in tests
//jest.mock('bootstrap/dist/css/bootstrap.css', () => ({}), { virtual: true });
//jest.mock('bootstrap/dist/js/bootstrap.bundle.min.js', () => ({}));
//jest.mock('@/styles/Sidebar.css', () => ({}), { virtual: true });

// Mock App so we can easily detect it was passed to render
jest.mock('../App.tsx', () => () => <div>MOCKED APP</div>);

// Spy on createRoot and capture the render fn
const renderSpy = jest.fn();
const createRootSpy = jest.spyOn(ReactDOMClient, 'createRoot')
  .mockImplementation((): any => ({ render: renderSpy }));

describe('main.tsx bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '<div id="root"></div>';
  });

  it('creates a root and renders the app under BrowserRouter/StrictMode', async () => {
    // Import AFTER setting up #root and mocks so the module executes with our spies in place
    await import('@/main');

    const rootEl = document.getElementById('root');
    expect(rootEl).not.toBeNull();

    // createRoot was called with the #root element
    expect(createRootSpy).toHaveBeenCalledTimes(1);
    expect(createRootSpy).toHaveBeenCalledWith(rootEl);

    // Then render was called exactly once with a React element tree
    expect(renderSpy).toHaveBeenCalledTimes(1);
    const renderedTree = renderSpy.mock.calls[0][0];

    // Sanity-check the shape of the rendered element
    // Top-level should be <StrictMode>, so typeof is object and $$typeof exists
    expect(typeof renderedTree).toBe('object');
    expect(renderedTree).toHaveProperty('type', React.StrictMode);

    // Peek one level into StrictMode -> children to ensure BrowserRouter is inside
    const strictChildren = (renderedTree as any).props.children;
    // <BrowserRouter> is the first child of <StrictMode>
    const browserRouterEl = Array.isArray(strictChildren) ? strictChildren[0] : strictChildren;
    // react-router-dom sets a function component for BrowserRouter; we check it’s a valid element
    expect(typeof browserRouterEl).toBe('object');
    expect(browserRouterEl).toHaveProperty('props');

    // Finally ensure our mocked App component is somewhere inside.
    // children of BrowserRouter should include App; drill a bit:
    const appCandidate =
      (browserRouterEl as any).props.children ||
      (browserRouterEl as any).props?.children?.props?.children;

    // Since our mocked App renders <div>MOCKED APP</div>, we should find that element in the tree
    // (It will be under StrictMode -> BrowserRouter -> App)
    // We can do a shallow-ish check by stringifying the element tree.
    const treeString = JSON.stringify(renderSpy.mock.calls[0][0], (_k, v) =>
      typeof v === 'function' ? `[Function ${v.name || 'anonymous'}]` : v
    );
    expect(treeString).toMatch(/MOCKED APP/);
  });

  it('does nothing if #root is missing (guard works)', async () => {
    document.body.innerHTML = ''; // remove the root
    await import('@/main');

    // No root to mount into -> no calls
    expect(createRootSpy).not.toHaveBeenCalled();
    expect(renderSpy).not.toHaveBeenCalled();
  });
});