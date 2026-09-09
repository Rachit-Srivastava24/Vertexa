import React from 'react'
import { Link } from "react-router-dom";
import "../App.css"

export default function Landing() {

  return (
    <div className='landingPageContainer'>

      <nav>

        <div className='navHeader'>
          <h1>Vertexa</h1>
        </div>

        <div className='navList'>

          {/* Join as Guest */}
          <Link to="/meet">
            <p>Join as Guest</p>
          </Link>

          {/* Register */}
          <Link to="/auth?mode=register">
            <p>Register</p>
          </Link>

          {/* Login */}
          <Link to="/auth?mode=login">
            <p>Login</p>
          </Link>

        </div>

      </nav>

      <div className='landingMainContainer'>

        <div>

          <h2>
            <span style={{ color: '#A855F7' }}>
              Connect
            </span>{" "}
            with your Loved Ones
          </h2>

          <h3>
            Stay Close,Wherever you are
          </h3>

          <div
            role="button"
            className='getConnectedButton'
          >
            <Link to="/auth?mode=login">
              Get Connected
            </Link>
          </div>

        </div>

        <div>

          <img
            src="/Mobile2.png"
            alt="Video Call"
            className="mobile-image"
          />

        </div>

      </div>

    </div>
  )
}
