"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState(""); 
  const [name, setName] = useState(""); 
  const [password, setPassword] = useState(""); 
  
  const onSubmit = () => {
    authClient.signUp.email({
      email,
      name, 
      password
    },{
      onError: () => {
        window.alert("Something went wrong");
      },
      onSuccess: () => {
        window.alert("Success");
      }
  });
}

  return (
    <div className="p-4 flex flex-col gap-y-4">
      <Input 
        placeholder="Name" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
      />
      <Input 
        placeholder="E-mail" 
        type="email"
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input 
        placeholder="Password" 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button onClick={onSubmit}>
        Create User
      </Button>
    </div>
  );
}