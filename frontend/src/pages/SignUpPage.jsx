import React, { useState } from 'react'
import {motion} from 'framer-motion'
import Input from '../components/input';
import {Lock, Mail, User, Loader} from 'lucide-react'
import {Link, useNavigate} from 'react-router-dom'
import PasswordStrenghtMeter from '../components/PasswordStrenghtMeter';
import {useAuthStore} from '../store/authStore.js'
const SignUpPage = () => {

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {signup, error, isLoading} = useAuthStore()
  const navigate = useNavigate();
  const handleSignUp = async (e) => {
    e.preventDefault();

    try {
      await signup(email, password, name)
      navigate("/verify-email")
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden'
    >
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">
          Create Account
        </h2>
        <form onSubmit={handleSignUp}>
          <Input 
          icon={User}
          type='text'
          placeholder='Full Name'
          value = {name}
          onChange={(e) => setName(e.target.value)}
          />
          <Input 
          icon={Mail}
          type='email'
          placeholder='Email Address'
          value = {email}
          onChange={(e) => setEmail(e.target.value)}
          />
          <Input 
          icon={Lock}
          type='password'
          placeholder='Password'
          value = {password}
          onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className='text-red-500 font-semibold mt-2'>{error}</p>}

          <PasswordStrenghtMeter password={password} />

          <motion.button
            className='mt-5 w-full py-3 px-4 bg-primary text-white font-bold rounded-lg shadow-lg hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white transition duration-200'
            whileHover={{scale: 1.02}}
            whileTap={{scale: 0.98}}
            type='submit'
            disabled ={isLoading}
          >
            {isLoading ? <Loader className='animate-spin mx-auto' size={24}/>  : "Sign Up"}
          </motion.button>
        </form>
      </div>
      <div className="px-8 py-4 bg-white border-t border-gray-200 flex justify-center">
        <p className='text-sm text-gray-700'>
          Already have an account? {" "}
          <Link to={"/login"} className='text-primary hover:brightness-110'>Login</Link>
        </p>
      </div>
    </motion.div>
  )
}

export default SignUpPage
