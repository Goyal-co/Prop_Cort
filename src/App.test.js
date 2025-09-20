import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Titan Brain heading', () => {
  render(<App />);
  const linkElement = screen.getByText(/Titan Brain/i);
  expect(linkElement).toBeInTheDocument();
});

test('renders welcome message', () => {
  render(<App />);
  const welcomeElement = screen.getByText(/Welcome to Titan Brain/i);
  expect(welcomeElement).toBeInTheDocument();
});

test('renders get started button', () => {
  render(<App />);
  const buttonElement = screen.getByText(/Get Started/i);
  expect(buttonElement).toBeInTheDocument();
});
