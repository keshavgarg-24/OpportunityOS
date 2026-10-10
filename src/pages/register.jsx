import { useState } from 'react';
import api from '../api/api';
import { useNavigate, Link } from 'react-router-dom';

export default function Register(){
  const [form,setForm]=useState({name:'',email:'',password:''});
  const navigate = useNavigate();

  const submit = async (e)=>{
    e.preventDefault();
    try{
      await api.post('/auth/register', form);
      alert('Registered! Ab Login karo');
      navigate('/login');
    }catch(err){
      alert(err.response?.data?.message || 'Register Failed');
    }
  }

  return(
    <div style={{maxWidth:400, margin:'50px auto'}}>
      <h2>Register</h2>
      <form onSubmit={submit}>
        <input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required style={{width:'100%', padding:8, marginBottom:10}}/><br/>
        <input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required style={{width:'100%', padding:8, marginBottom:10}}/><br/>
        <input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required style={{width:'100%', padding:8, marginBottom:10}}/><br/>
        <button style={{width:'100%', padding:8}}>Register</button>
      </form>
      <p>Already account hai? <Link to="/login">Login</Link></p>
    </div>
  )
}