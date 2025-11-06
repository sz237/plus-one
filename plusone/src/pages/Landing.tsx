import { Link } from "react-router-dom";

function Landing() {
  return (
    <section className="min-vh-100 d-flex align-items-center bg-white">
      <div className="container">
        <div className="d-flex flex-column align-items-center text-center">
          <img
            src="/plusone-logo.svg"
            alt="PlusOne logo"
            className="mb-3 landing-logo"
          />
          <h1 className="display-4 fw-bold text-dark mb-1">PlusOne</h1>

          <div className="d-flex gap-3 mt-4">
            <Link className="btn btn-primary btn-lg px-4" to="/signup">
              Sign up
            </Link>
            <Link className="btn btn-outline-dark btn-lg px-4" to="/login">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Landing;
