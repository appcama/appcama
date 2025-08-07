
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ValidationEmailRequest {
  userId: number;
  email: string;
  userName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, email, userName }: ValidationEmailRequest = await req.json();

    // Generate token using database function
    const { data: token, error: tokenError } = await supabase
      .rpc('generate_user_token', { user_id_param: userId });

    if (tokenError || !token) {
      throw new Error(`Failed to generate token: ${tokenError?.message}`);
    }

    // Send email with token
    const emailResponse = await resend.emails.send({
      from: "ReciclaSystem <onboarding@resend.dev>",
      to: [email],
      subject: "Validação de Conta - ReciclaSystem",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; margin: 0;">ReciclaSystem</h1>
            <p style="color: #6b7280; margin: 5px 0;">Sistema de Gestão de Reciclagem</p>
          </div>
          
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0;">
            <h2 style="color: #111827; margin: 0 0 20px 0;">Bem-vindo, ${userName}!</h2>
            <p style="color: #374151; line-height: 1.6; margin: 0 0 20px 0;">
              Sua conta foi criada com sucesso. Para ativar sua conta e definir sua senha, 
              você precisa validar seu email usando o código abaixo:
            </p>
            
            <div style="background-color: #white; border: 2px solid #059669; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="color: #374151; margin: 0 0 10px 0; font-weight: bold;">Código de Validação:</p>
              <div style="font-size: 32px; font-weight: bold; color: #059669; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                ${token}
              </div>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin: 20px 0 0 0;">
              <strong>Instruções:</strong><br>
              1. Acesse o sistema ReciclaSystem<br>
              2. Faça login com seu email e a senha temporária: <code>123456789</code><br>
              3. Digite o código de validação acima<br>
              4. Defina sua nova senha
            </p>
          </div>
          
          <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              ⚠️ <strong>Importante:</strong> Este código é válido por 24 horas e só pode ser usado uma vez.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Se você não solicitou esta conta, pode ignorar este email.<br>
              Este código expira em 24 horas.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Validation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        token: token,
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-validation-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
