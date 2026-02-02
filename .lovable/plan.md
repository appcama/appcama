
## Plano: Enviar Email de Validação ao Resetar Senha

### Problema Identificado

Ao clicar em "Resetar Senha" no `UsuariosList.tsx`:
1. A função `reset_user_password` no banco apenas atualiza a senha para '123456789' e marca como não validada
2. **Nenhum email ou token é gerado/enviado**
3. O usuário não tem como saber seu código de validação

### Fluxo Atual vs Esperado

| Etapa | Atual | Esperado |
|-------|-------|----------|
| 1. Clica em Resetar | Apenas atualiza banco | Atualiza banco |
| 2. Token | Não gera | Gera novo token |
| 3. Email | Não envia | Envia email com token |
| 4. Feedback | "Senha resetada para 123456789" | Mostra sucesso ou erro do email |

### Solução

Modificar a função `resetPasswordMutation` no `UsuariosList.tsx` para:
1. Primeiro chamar a RPC `reset_user_password` (já existente)
2. Depois chamar a edge function `send-validation-email` para enviar o email

### Arquivo a Modificar

#### `src/components/UsuariosList.tsx`

**1. Modificar `resetPasswordMutation` (linhas 161-184):**

```typescript
const resetPasswordMutation = useMutation({
  mutationFn: async (usuario: Usuario) => {
    // 1. Resetar senha no banco
    const { error } = await supabase.rpc('reset_user_password', {
      user_id_param: usuario.id_usuario
    });

    if (error) throw error;

    // 2. Enviar email de validação com novo token
    const { data, error: emailError } = await supabase.functions.invoke('send-validation-email', {
      body: {
        userId: usuario.id_usuario,
        email: usuario.des_email,
        userName: usuario.des_email.split('@')[0]
      }
    });

    if (emailError) {
      console.error('Erro ao enviar email:', emailError);
      throw new Error(`Senha resetada, mas erro ao enviar email: ${emailError.message}`);
    }

    if (data && !data.success) {
      console.error('Edge function retornou erro:', data);
      throw new Error(`Senha resetada, mas erro ao enviar email: ${data.error}`);
    }

    return data;
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    toast({
      title: "Sucesso",
      description: `Senha resetada e email de validação enviado para ${data?.sentTo || 'o usuário'}`,
    });
  },
  onError: (error: any) => {
    queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    toast({
      title: "Atenção",
      description: error.message || "Erro ao resetar senha do usuário",
      variant: "destructive",
    });
    console.error('Erro ao resetar senha:', error);
  },
});
```

**2. Modificar `handleResetPassword` (linha 200-202):**

```typescript
const handleResetPassword = (usuario: Usuario) => {
  resetPasswordMutation.mutate(usuario);
};
```

**3. Atualizar chamada no AlertDialog (linha ~280):**

```typescript
<AlertDialogAction onClick={() => handleResetPassword(usuario)}>
  Resetar
</AlertDialogAction>
```

**4. Atualizar mensagem do AlertDialog (linha ~272):**

```typescript
<AlertDialogDescription>
  Tem certeza que deseja resetar a senha deste usuário? 
  A nova senha será "123456789" e um email de validação será enviado.
</AlertDialogDescription>
```

### Resultado Esperado

| Etapa | Comportamento |
|-------|---------------|
| Clique em Resetar | Abre diálogo de confirmação |
| Confirmar | Reseta senha + Gera token + Envia email |
| Sucesso | Toast: "Senha resetada e email enviado para X" |
| Erro no email | Toast: "Senha resetada, mas erro ao enviar email: [motivo]" |

### Dependências
- Edge function `send-validation-email` já existe e funciona
- Função RPC `reset_user_password` já existe
- Função RPC `generate_user_token` já existe (usada pela edge function)

### Considerações
- Se o email falhar, a senha ainda foi resetada - o usuário pode usar 123456789
- O token será exibido na tela de confirmação para casos de teste (igual ao criar usuário)
- Mantém compatibilidade com o fluxo atual
