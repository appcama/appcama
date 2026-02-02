
## Plano: Atualizar Template do Email de Validação

### Alterações Solicitadas

| Item | Atual | Novo |
|------|-------|------|
| Nome do sistema | ReciclaSystem | ReCiclaÊ |
| Subtítulo | Sistema de Gestão de Reciclagem | Sistema de Gestão de Reciclagem |
| Logo | Não tem | Adicionar logo ReCiclaÊ |
| Login | "Faça login com o email: X" | "Faça login com o CPF/CNPJ: X" |

### Arquivos a Modificar

#### 1. Edge Function: `supabase/functions/send-validation-email/index.ts`

**Mudanças na interface (linha 12-16):**
```typescript
interface ValidationEmailRequest {
  userId: number;
  email: string;
  userName: string;
  cpfCnpj?: string; // Novo campo para CPF/CNPJ
}
```

**Mudanças no template do email (linhas 117-164):**

1. **Remetente (linha 118):**
   - De: `"ReciclaSystem <noreply@rcyclae.com.br>"`
   - Para: `"ReCiclaÊ <noreply@rcyclae.com.br>"`

2. **Assunto (linha 120):**
   - De: `Validação de Conta - ReciclaSystem`
   - Para: `Validação de Conta - ReCiclaÊ`

3. **Header com logo (linhas 122-126):**
   ```html
   <div style="text-align: center; margin-bottom: 30px;">
     <img src="https://appcama.lovable.app/reciclae-logo.png" 
          alt="ReCiclaÊ" 
          style="max-width: 180px; height: auto; margin-bottom: 10px;" />
     <h1 style="color: #059669; margin: 0;">ReCiclaÊ</h1>
     <p style="color: #6b7280; margin: 5px 0;">Sistema de Gestão de Reciclagem</p>
   </div>
   ```

4. **Instruções de login (linha 144-145):**
   - De: `Faça login com o email: <strong>${email}</strong>`
   - Para: `Faça login com o CPF/CNPJ: <strong>${cpfCnpj || 'não informado'}</strong>`

5. **Nome do sistema nas instruções (linha 143):**
   - De: `Acesse o sistema ReciclaSystem`
   - Para: `Acesse o sistema ReCiclaÊ`

#### 2. Frontend: `src/components/UsuariosList.tsx`

**Adicionar CPF/CNPJ na chamada da edge function (linhas 171-177):**
```typescript
const { data, error: emailError } = await supabase.functions.invoke('send-validation-email', {
  body: {
    userId: usuario.id_usuario,
    email: usuario.des_email,
    userName: usuario.des_email?.split('@')[0] || 'Usuário',
    cpfCnpj: usuario.entidade?.num_cpf_cnpj || '' // Novo campo
  }
});
```

#### 3. Frontend: `src/components/UsuarioForm.tsx`

**Buscar CPF/CNPJ da entidade selecionada ao criar usuário (linha 105-111):**

Precisa buscar o CPF/CNPJ da entidade para enviar junto com o email de validação ao criar um novo usuário.

### Verificação da Logo

A logo `reciclae-logo.png` já existe em `public/reciclae-logo.png` e estará disponível na URL publicada.

### Resultado Final do Email

```text
┌─────────────────────────────────────────────┐
│          [LOGO ReCiclaÊ]                    │
│                                             │
│            ReCiclaÊ                         │
│    Sistema de Gestão de Reciclagem          │
├─────────────────────────────────────────────┤
│                                             │
│  Bem-vindo, [nome]!                         │
│                                             │
│  Sua conta foi criada com sucesso...        │
│                                             │
│  ┌────────────────────────────┐            │
│  │   Código de Validação:     │            │
│  │        161861              │            │
│  └────────────────────────────┘            │
│                                             │
│  Instruções:                                │
│  1. Acesse o sistema ReCiclaÊ              │
│  2. Faça login com o CPF/CNPJ: 123.456.789-00 │
│     e a senha temporária: 123456789         │
│  3. Digite o código de validação acima      │
│  4. Defina sua nova senha                   │
│                                             │
└─────────────────────────────────────────────┘
```

### Resumo das Mudanças

| Arquivo | Alteração |
|---------|-----------|
| `send-validation-email/index.ts` | Atualizar nome, logo e trocar email por CPF/CNPJ |
| `UsuariosList.tsx` | Passar CPF/CNPJ para a edge function |
| `UsuarioForm.tsx` | Buscar e passar CPF/CNPJ ao criar usuário |
