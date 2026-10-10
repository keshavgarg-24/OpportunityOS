import { useState } from 'react';
import api from '../api/api';
import { useNavigate, Link } from 'react-router-dom';

export default function Login(){
  const [form,setForm]=useState({email:'',password:''});
  const navigate = useNavigate();

  const submit = async (e)=>{
    e.preventDefault();
    try{
      const {data}= await api.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      alert('Login Success!');
      navigate('/');
    }catch(err){
      alert(err.response?.data?.message || 'Login Failed');
    }
  }

  return(
    <div style={{maxWidth:400, margin:'50px auto'}}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required style={{width:'100%', padding:8, marginBottom:10}}/><br/>
        <input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required style={{width:'100%', padding:8, marginBottom:10}}/><br/>
        <button style={{width:'100%', padding:8}}>Login</button>
      </form>
      <p>Account nahi hai? <Link to="/register">Register</Link></p>
    </div>
  )
}