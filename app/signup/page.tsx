import SignupForm from '@/components/signupForm'
import React from 'react'

function Signup() {
return (
      <div className="container d-flex flex-column flex-lg-row align-items-center justify-content-center vh-100">
            
            {/* Section gauche avec un design attractif */}
            <div className="w-lg-50 text-center bg-primary text-white p-4 rounded mb-4 mb-lg-0 me-lg-4 shadow">
                <div>
                    <h1 className="fw-bold mb-3">Easy Medical</h1>
                    <p className="lead">Votre santé, notre priorité.<br />Créez votre compte  pour accéder à nos services.</p>
                </div>
                <div>
                    <img
                    src="/images/inscription.jpeg"
                    alt="Inscription"
                    className="img-fluid mt-3 bg"
                    style={{ maxWidth: "300px", 
                        backgroundSize: "cover", 
                        borderRadius: "10px",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                     }}
                    
                />
                </div>
            </div>

            {/* Section droite avec le formulaire */}
            <div className=" w-lg-50 col-md-6 col-lg-6 mt-4 mt-lg-0 shadow p-4 rounded bg-white">
                <SignupForm />
            </div>
        </div>
  )
}

export default Signup
