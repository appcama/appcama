export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      certificado: {
        Row: {
          cod_validador: string
          dat_atualizacao: string | null
          dat_criacao: string
          id_certificado: number
          id_entidade: number
          id_usuario_atualizador: number | null
          id_usuario_criador: number
        }
        Insert: {
          cod_validador: string
          dat_atualizacao?: string | null
          dat_criacao: string
          id_certificado?: number
          id_entidade: number
          id_usuario_atualizador?: number | null
          id_usuario_criador: number
        }
        Update: {
          cod_validador?: string
          dat_atualizacao?: string | null
          dat_criacao?: string
          id_certificado?: number
          id_entidade?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador?: number
        }
        Relationships: [
          {
            foreignKeyName: "certificado_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "entidade"
            referencedColumns: ["id_entidade"]
          },
          {
            foreignKeyName: "certificado_id_usuario_atualizador_fkey"
            columns: ["id_usuario_atualizador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
          {
            foreignKeyName: "certificado_id_usuario_criador_fkey"
            columns: ["id_usuario_criador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      coleta: {
        Row: {
          cod_coleta: string
          dat_atualizacao: string | null
          dat_coleta: string
          dat_criacao: string
          des_locked: string
          des_status: string
          id_coleta: number
          id_entidade_geradora: number | null
          id_evento: number | null
          id_ponto_coleta: number | null
          id_tipo_situacao: number
          id_usuario_atualizador: number | null
          id_usuario_criador: number
          vlr_total: number
        }
        Insert: {
          cod_coleta: string
          dat_atualizacao?: string | null
          dat_coleta: string
          dat_criacao: string
          des_locked?: string
          des_status?: string
          id_coleta?: number
          id_entidade_geradora?: number | null
          id_evento?: number | null
          id_ponto_coleta?: number | null
          id_tipo_situacao: number
          id_usuario_atualizador?: number | null
          id_usuario_criador: number
          vlr_total: number
        }
        Update: {
          cod_coleta?: string
          dat_atualizacao?: string | null
          dat_coleta?: string
          dat_criacao?: string
          des_locked?: string
          des_status?: string
          id_coleta?: number
          id_entidade_geradora?: number | null
          id_evento?: number | null
          id_ponto_coleta?: number | null
          id_tipo_situacao?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador?: number
          vlr_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "coleta_id_entidade_geradora_fkey"
            columns: ["id_entidade_geradora"]
            isOneToOne: false
            referencedRelation: "entidade"
            referencedColumns: ["id_entidade"]
          },
          {
            foreignKeyName: "coleta_id_evento_fkey"
            columns: ["id_evento"]
            isOneToOne: false
            referencedRelation: "evento"
            referencedColumns: ["id_evento"]
          },
          {
            foreignKeyName: "coleta_id_ponto_coleta_fkey"
            columns: ["id_ponto_coleta"]
            isOneToOne: false
            referencedRelation: "ponto_coleta"
            referencedColumns: ["id_ponto_coleta"]
          },
          {
            foreignKeyName: "coleta_id_tipo_situacao_fkey"
            columns: ["id_tipo_situacao"]
            isOneToOne: false
            referencedRelation: "tipo_situacao"
            referencedColumns: ["id_tipo_situacao"]
          },
          {
            foreignKeyName: "coleta_id_usuario_atualizador_fkey"
            columns: ["id_usuario_atualizador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
          {
            foreignKeyName: "coleta_id_usuario_criador_fkey"
            columns: ["id_usuario_criador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      coleta_residuo: {
        Row: {
          dat_atualizacao: string | null
          dat_criacao: string
          des_locked: string
          des_status: string
          id_coleta: number | null
          id_coleta_residuo: number
          id_residuo: number | null
          id_tipo_situacao: number
          id_usuario_atualizador: number | null
          id_usuario_criador: number
          qtd_total: number
          vlr_total: number
        }
        Insert: {
          dat_atualizacao?: string | null
          dat_criacao: string
          des_locked?: string
          des_status?: string
          id_coleta?: number | null
          id_coleta_residuo?: number
          id_residuo?: number | null
          id_tipo_situacao: number
          id_usuario_atualizador?: number | null
          id_usuario_criador: number
          qtd_total: number
          vlr_total: number
        }
        Update: {
          dat_atualizacao?: string | null
          dat_criacao?: string
          des_locked?: string
          des_status?: string
          id_coleta?: number | null
          id_coleta_residuo?: number
          id_residuo?: number | null
          id_tipo_situacao?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador?: number
          qtd_total?: number
          vlr_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "coleta_residuo_id_coleta_fkey"
            columns: ["id_coleta"]
            isOneToOne: false
            referencedRelation: "coleta"
            referencedColumns: ["id_coleta"]
          },
          {
            foreignKeyName: "coleta_residuo_id_residuo_fkey"
            columns: ["id_residuo"]
            isOneToOne: false
            referencedRelation: "residuo"
            referencedColumns: ["id_residuo"]
          },
          {
            foreignKeyName: "coleta_residuo_id_tipo_situacao_fkey"
            columns: ["id_tipo_situacao"]
            isOneToOne: false
            referencedRelation: "tipo_situacao"
            referencedColumns: ["id_tipo_situacao"]
          },
          {
            foreignKeyName: "coleta_residuo_id_usuario_atualizador_fkey"
            columns: ["id_usuario_atualizador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
          {
            foreignKeyName: "coleta_residuo_id_usuario_criador_fkey"
            columns: ["id_usuario_criador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      coleta_residuo_indicador: {
        Row: {
          id_coleta_residuo: number
          id_coleta_residuo_indicador: number
          id_indicador: number
          qtd_total: number | null
        }
        Insert: {
          id_coleta_residuo: number
          id_coleta_residuo_indicador?: number
          id_indicador: number
          qtd_total?: number | null
        }
        Update: {
          id_coleta_residuo?: number
          id_coleta_residuo_indicador?: number
          id_indicador?: number
          qtd_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coleta_residuo_indicador_id_coleta_residuo_fkey"
            columns: ["id_coleta_residuo"]
            isOneToOne: false
            referencedRelation: "coleta_residuo"
            referencedColumns: ["id_coleta_residuo"]
          },
          {
            foreignKeyName: "coleta_residuo_indicador_id_indicador_fkey"
            columns: ["id_indicador"]
            isOneToOne: false
            referencedRelation: "indicador"
            referencedColumns: ["id_indicador"]
          },
        ]
      }
      entidade: {
        Row: {
          dat_atualizacao: string | null
          dat_criacao: string
          des_bairro: string
          des_email: string | null
          des_locked: string
          des_logradouro: string
          des_status: string
          id_entidade: number
          id_municipio: number
          id_tipo_entidade: number
          id_tipo_pessoa: number
          id_tipo_situacao: number
          id_unidade_federativa: number
          id_usuario_atualizador: number | null
          id_usuario_criador: number
          nom_entidade: string
          nom_razao_social: string | null
          num_cep: string
          num_cpf_cnpj: string
          num_telefone: string | null
        }
        Insert: {
          dat_atualizacao?: string | null
          dat_criacao: string
          des_bairro: string
          des_email?: string | null
          des_locked?: string
          des_logradouro: string
          des_status?: string
          id_entidade?: number
          id_municipio: number
          id_tipo_entidade: number
          id_tipo_pessoa: number
          id_tipo_situacao: number
          id_unidade_federativa: number
          id_usuario_atualizador?: number | null
          id_usuario_criador: number
          nom_entidade: string
          nom_razao_social?: string | null
          num_cep: string
          num_cpf_cnpj: string
          num_telefone?: string | null
        }
        Update: {
          dat_atualizacao?: string | null
          dat_criacao?: string
          des_bairro?: string
          des_email?: string | null
          des_locked?: string
          des_logradouro?: string
          des_status?: string
          id_entidade?: number
          id_municipio?: number
          id_tipo_entidade?: number
          id_tipo_pessoa?: number
          id_tipo_situacao?: number
          id_unidade_federativa?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador?: number
          nom_entidade?: string
          nom_razao_social?: string | null
          num_cep?: string
          num_cpf_cnpj?: string
          num_telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entidade_id_tipo_entidade_fkey"
            columns: ["id_tipo_entidade"]
            isOneToOne: false
            referencedRelation: "tipo_entidade"
            referencedColumns: ["id_tipo_entidade"]
          },
          {
            foreignKeyName: "entidade_id_tipo_situacao_fkey"
            columns: ["id_tipo_situacao"]
            isOneToOne: false
            referencedRelation: "tipo_situacao"
            referencedColumns: ["id_tipo_situacao"]
          },
          {
            foreignKeyName: "entidade_id_usuario_atualizador_fkey"
            columns: ["id_usuario_atualizador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
          {
            foreignKeyName: "entidade_id_usuario_criador_fkey"
            columns: ["id_usuario_criador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      evento: {
        Row: {
          dat_atualizacao: string | null
          dat_criacao: string
          dat_inicio: string
          dat_termino: string
          des_evento: string | null
          des_locked: string
          des_status: string
          id_evento: number
          id_usuario_atualizador: number | null
          id_usuario_criador: number
          nom_evento: string | null
        }
        Insert: {
          dat_atualizacao?: string | null
          dat_criacao: string
          dat_inicio: string
          dat_termino: string
          des_evento?: string | null
          des_locked?: string
          des_status?: string
          id_evento?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador: number
          nom_evento?: string | null
        }
        Update: {
          dat_atualizacao?: string | null
          dat_criacao?: string
          dat_inicio?: string
          dat_termino?: string
          des_evento?: string | null
          des_locked?: string
          des_status?: string
          id_evento?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador?: number
          nom_evento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_id_usuario_atualizador_fkey"
            columns: ["id_usuario_atualizador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
          {
            foreignKeyName: "evento_id_usuario_criador_fkey"
            columns: ["id_usuario_criador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      funcionalidade: {
        Row: {
          dat_atualizacao: string | null
          dat_criacao: string
          des_locked: string
          des_status: string
          id_funcionalidade: number
          id_usuario_atualizador: number | null
          id_usuario_criador: number
          nom_funcionalidade: string | null
        }
        Insert: {
          dat_atualizacao?: string | null
          dat_criacao: string
          des_locked?: string
          des_status?: string
          id_funcionalidade?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador: number
          nom_funcionalidade?: string | null
        }
        Update: {
          dat_atualizacao?: string | null
          dat_criacao?: string
          des_locked?: string
          des_status?: string
          id_funcionalidade?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador?: number
          nom_funcionalidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionalidade_id_usuario_atualizador_fkey"
            columns: ["id_usuario_atualizador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
          {
            foreignKeyName: "funcionalidade_id_usuario_criador_fkey"
            columns: ["id_usuario_criador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      grupo_residuo: {
        Row: {
          des_grupo_residuo: string | null
          id_grupo_residuo: number
        }
        Insert: {
          des_grupo_residuo?: string | null
          id_grupo_residuo?: number
        }
        Update: {
          des_grupo_residuo?: string | null
          id_grupo_residuo?: number
        }
        Relationships: []
      }
      indicador: {
        Row: {
          dat_atualizacao: string | null
          dat_criacao: string
          des_locked: string
          des_status: string
          id_indicador: number
          id_unidade_medida: number
          id_usuario_atualizador: number | null
          id_usuario_criador: number
          nom_indicador: string | null
        }
        Insert: {
          dat_atualizacao?: string | null
          dat_criacao: string
          des_locked?: string
          des_status?: string
          id_indicador?: number
          id_unidade_medida: number
          id_usuario_atualizador?: number | null
          id_usuario_criador: number
          nom_indicador?: string | null
        }
        Update: {
          dat_atualizacao?: string | null
          dat_criacao?: string
          des_locked?: string
          des_status?: string
          id_indicador?: number
          id_unidade_medida?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador?: number
          nom_indicador?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "indicador_id_unidade_medida_fkey"
            columns: ["id_unidade_medida"]
            isOneToOne: false
            referencedRelation: "unidade_medida"
            referencedColumns: ["id_unidade_medida"]
          },
          {
            foreignKeyName: "indicador_id_usuario_atualizador_fkey"
            columns: ["id_usuario_atualizador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
          {
            foreignKeyName: "indicador_id_usuario_criador_fkey"
            columns: ["id_usuario_criador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      perfil: {
        Row: {
          dat_atualizacao: string | null
          dat_criacao: string
          des_locked: string
          des_status: string
          id_perfil: number
          id_usuario_atualizador: number | null
          id_usuario_criador: number
          nom_perfil: string | null
        }
        Insert: {
          dat_atualizacao?: string | null
          dat_criacao: string
          des_locked?: string
          des_status?: string
          id_perfil?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador: number
          nom_perfil?: string | null
        }
        Update: {
          dat_atualizacao?: string | null
          dat_criacao?: string
          des_locked?: string
          des_status?: string
          id_perfil?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador?: number
          nom_perfil?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfil_id_usuario_atualizador_fkey"
            columns: ["id_usuario_atualizador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      perfil__funcionalidade: {
        Row: {
          id_funcionalidade: number
          id_perfil: number
        }
        Insert: {
          id_funcionalidade: number
          id_perfil: number
        }
        Update: {
          id_funcionalidade?: number
          id_perfil?: number
        }
        Relationships: [
          {
            foreignKeyName: "perfil__funcionalidade_id_funcionalidade_fkey"
            columns: ["id_funcionalidade"]
            isOneToOne: false
            referencedRelation: "funcionalidade"
            referencedColumns: ["id_funcionalidade"]
          },
          {
            foreignKeyName: "perfil__funcionalidade_id_perfil_fkey"
            columns: ["id_perfil"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id_perfil"]
          },
        ]
      }
      ponto_coleta: {
        Row: {
          dat_atualizacao: string | null
          dat_criacao: string
          des_bairro: string
          des_locked: string
          des_logradouro: string
          des_status: string
          id_entidade_gestora: number
          id_municipio: number
          id_ponto_coleta: number
          id_tipo_ponto_coleta: number
          id_tipo_situacao: number
          id_unidade_federativa: number
          id_usuario_atualizador: number | null
          id_usuario_criador: number
          nom_ponto_coleta: string
          num_cep: string
          num_latitude: number | null
          num_longitude: number | null
        }
        Insert: {
          dat_atualizacao?: string | null
          dat_criacao: string
          des_bairro: string
          des_locked?: string
          des_logradouro: string
          des_status?: string
          id_entidade_gestora: number
          id_municipio: number
          id_ponto_coleta?: number
          id_tipo_ponto_coleta: number
          id_tipo_situacao: number
          id_unidade_federativa: number
          id_usuario_atualizador?: number | null
          id_usuario_criador: number
          nom_ponto_coleta: string
          num_cep: string
          num_latitude?: number | null
          num_longitude?: number | null
        }
        Update: {
          dat_atualizacao?: string | null
          dat_criacao?: string
          des_bairro?: string
          des_locked?: string
          des_logradouro?: string
          des_status?: string
          id_entidade_gestora?: number
          id_municipio?: number
          id_ponto_coleta?: number
          id_tipo_ponto_coleta?: number
          id_tipo_situacao?: number
          id_unidade_federativa?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador?: number
          nom_ponto_coleta?: string
          num_cep?: string
          num_latitude?: number | null
          num_longitude?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ponto_coleta_id_entidade_gestora_fkey"
            columns: ["id_entidade_gestora"]
            isOneToOne: false
            referencedRelation: "entidade"
            referencedColumns: ["id_entidade"]
          },
          {
            foreignKeyName: "ponto_coleta_id_tipo_ponto_coleta_fkey"
            columns: ["id_tipo_ponto_coleta"]
            isOneToOne: false
            referencedRelation: "tipo_ponto_coleta"
            referencedColumns: ["id_tipo_ponto_coleta"]
          },
          {
            foreignKeyName: "ponto_coleta_id_tipo_situacao_fkey"
            columns: ["id_tipo_situacao"]
            isOneToOne: false
            referencedRelation: "tipo_situacao"
            referencedColumns: ["id_tipo_situacao"]
          },
          {
            foreignKeyName: "ponto_coleta_id_usuario_atualizador_fkey"
            columns: ["id_usuario_atualizador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
          {
            foreignKeyName: "ponto_coleta_id_usuario_criador_fkey"
            columns: ["id_usuario_criador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      ponto_entrega: {
        Row: {
          id_entidade_recicladora: number
          id_ponto_entrega: number
        }
        Insert: {
          id_entidade_recicladora: number
          id_ponto_entrega?: number
        }
        Update: {
          id_entidade_recicladora?: number
          id_ponto_entrega?: number
        }
        Relationships: [
          {
            foreignKeyName: "ponto_entrega_id_entidade_recicladora_fkey"
            columns: ["id_entidade_recicladora"]
            isOneToOne: false
            referencedRelation: "entidade"
            referencedColumns: ["id_entidade"]
          },
        ]
      }
      residuo: {
        Row: {
          dat_atualizacao: string | null
          dat_criacao: string
          des_locked: string
          des_status: string
          id_residuo: number
          id_tipo_residuo: number
          id_usuario_atualizador: number | null
          id_usuario_criador: number
          nom_residuo: string
        }
        Insert: {
          dat_atualizacao?: string | null
          dat_criacao: string
          des_locked?: string
          des_status?: string
          id_residuo?: number
          id_tipo_residuo: number
          id_usuario_atualizador?: number | null
          id_usuario_criador: number
          nom_residuo: string
        }
        Update: {
          dat_atualizacao?: string | null
          dat_criacao?: string
          des_locked?: string
          des_status?: string
          id_residuo?: number
          id_tipo_residuo?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador?: number
          nom_residuo?: string
        }
        Relationships: [
          {
            foreignKeyName: "residuo_id_tipo_residuo_fkey"
            columns: ["id_tipo_residuo"]
            isOneToOne: false
            referencedRelation: "tipo_residuo"
            referencedColumns: ["id_tipo_residuo"]
          },
          {
            foreignKeyName: "residuo_id_usuario_atualizador_fkey"
            columns: ["id_usuario_atualizador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
          {
            foreignKeyName: "residuo_id_usuario_criador_fkey"
            columns: ["id_usuario_criador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      tipo_entidade: {
        Row: {
          dat_atualizacao: string | null
          dat_criacao: string
          des_coletora_residuo: string
          des_geradora_residuo: string
          des_locked: string
          des_status: string
          des_tipo_entidade: string | null
          id_tipo_entidade: number
          id_usuario_atualizador: number | null
          id_usuario_criador: number
        }
        Insert: {
          dat_atualizacao?: string | null
          dat_criacao: string
          des_coletora_residuo?: string
          des_geradora_residuo?: string
          des_locked?: string
          des_status?: string
          des_tipo_entidade?: string | null
          id_tipo_entidade?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador: number
        }
        Update: {
          dat_atualizacao?: string | null
          dat_criacao?: string
          des_coletora_residuo?: string
          des_geradora_residuo?: string
          des_locked?: string
          des_status?: string
          des_tipo_entidade?: string | null
          id_tipo_entidade?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador?: number
        }
        Relationships: []
      }
      tipo_ponto_coleta: {
        Row: {
          dat_atualizacao: string | null
          dat_criacao: string
          des_locked: string
          des_status: string
          des_tipo_ponto_coleta: string | null
          id_tipo_ponto_coleta: number
          id_usuario_atualizador: number | null
          id_usuario_criador: number
        }
        Insert: {
          dat_atualizacao?: string | null
          dat_criacao: string
          des_locked?: string
          des_status?: string
          des_tipo_ponto_coleta?: string | null
          id_tipo_ponto_coleta?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador: number
        }
        Update: {
          dat_atualizacao?: string | null
          dat_criacao?: string
          des_locked?: string
          des_status?: string
          des_tipo_ponto_coleta?: string | null
          id_tipo_ponto_coleta?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador?: number
        }
        Relationships: [
          {
            foreignKeyName: "tipo_ponto_coleta_id_usuario_atualizador_fkey"
            columns: ["id_usuario_atualizador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
          {
            foreignKeyName: "tipo_ponto_coleta_id_usuario_criador_fkey"
            columns: ["id_usuario_criador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      tipo_residuo: {
        Row: {
          dat_atualizacao: string | null
          dat_criacao: string
          des_locked: string
          des_recurso_natural: string | null
          des_status: string
          des_tipo_residuo: string | null
          id_grupo_residuo: number | null
          id_tipo_residuo: number
          id_usuario_atualizador: number | null
          id_usuario_criador: number
        }
        Insert: {
          dat_atualizacao?: string | null
          dat_criacao: string
          des_locked?: string
          des_recurso_natural?: string | null
          des_status?: string
          des_tipo_residuo?: string | null
          id_grupo_residuo?: number | null
          id_tipo_residuo?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador: number
        }
        Update: {
          dat_atualizacao?: string | null
          dat_criacao?: string
          des_locked?: string
          des_recurso_natural?: string | null
          des_status?: string
          des_tipo_residuo?: string | null
          id_grupo_residuo?: number | null
          id_tipo_residuo?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador?: number
        }
        Relationships: []
      }
      tipo_residuo__indicador: {
        Row: {
          id_indicador: number
          id_tipo_residuo: number
          qtd_referencia: number | null
        }
        Insert: {
          id_indicador: number
          id_tipo_residuo: number
          qtd_referencia?: number | null
        }
        Update: {
          id_indicador?: number
          id_tipo_residuo?: number
          qtd_referencia?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tipo_residuo__indicador_id_indicador_fkey"
            columns: ["id_indicador"]
            isOneToOne: false
            referencedRelation: "indicador"
            referencedColumns: ["id_indicador"]
          },
          {
            foreignKeyName: "tipo_residuo__indicador_id_tipo_residuo_fkey"
            columns: ["id_tipo_residuo"]
            isOneToOne: false
            referencedRelation: "tipo_residuo"
            referencedColumns: ["id_tipo_residuo"]
          },
        ]
      }
      tipo_situacao: {
        Row: {
          dat_atualizacao: string | null
          dat_criacao: string
          des_tipo_situacao: string
          id_tipo_situacao: number
          id_usuario_atualizador: number | null
          id_usuario_criador: number
        }
        Insert: {
          dat_atualizacao?: string | null
          dat_criacao: string
          des_tipo_situacao: string
          id_tipo_situacao?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador: number
        }
        Update: {
          dat_atualizacao?: string | null
          dat_criacao?: string
          des_tipo_situacao?: string
          id_tipo_situacao?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador?: number
        }
        Relationships: [
          {
            foreignKeyName: "tipo_situacao_id_usuario_atualizador_fkey"
            columns: ["id_usuario_atualizador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
          {
            foreignKeyName: "tipo_situacao_id_usuario_criador_fkey"
            columns: ["id_usuario_criador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      unidade_medida: {
        Row: {
          cod_unidade_medida: string | null
          des_unidade_medida: string | null
          id_unidade_medida: number
        }
        Insert: {
          cod_unidade_medida?: string | null
          des_unidade_medida?: string | null
          id_unidade_medida?: number
        }
        Update: {
          cod_unidade_medida?: string | null
          des_unidade_medida?: string | null
          id_unidade_medida?: number
        }
        Relationships: []
      }
      usuario: {
        Row: {
          dat_atualizacao: string | null
          dat_criacao: string
          des_email: string | null
          des_locked: string
          des_senha: string
          des_senha_validada: string
          des_status: string
          id_entidade: number
          id_perfil: number
          id_usuario: number
          id_usuario_atualizador: number | null
          id_usuario_criador: number
        }
        Insert: {
          dat_atualizacao?: string | null
          dat_criacao: string
          des_email?: string | null
          des_locked?: string
          des_senha: string
          des_senha_validada?: string
          des_status?: string
          id_entidade: number
          id_perfil: number
          id_usuario?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador: number
        }
        Update: {
          dat_atualizacao?: string | null
          dat_criacao?: string
          des_email?: string | null
          des_locked?: string
          des_senha?: string
          des_senha_validada?: string
          des_status?: string
          id_entidade?: number
          id_perfil?: number
          id_usuario?: number
          id_usuario_atualizador?: number | null
          id_usuario_criador?: number
        }
        Relationships: [
          {
            foreignKeyName: "usuario_id_entidade_fkey"
            columns: ["id_entidade"]
            isOneToOne: false
            referencedRelation: "entidade"
            referencedColumns: ["id_entidade"]
          },
          {
            foreignKeyName: "usuario_id_perfil_fkey"
            columns: ["id_perfil"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id_perfil"]
          },
          {
            foreignKeyName: "usuario_id_usuario_atualizador_fkey"
            columns: ["id_usuario_atualizador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
          {
            foreignKeyName: "usuario_id_usuario_criador_fkey"
            columns: ["id_usuario_criador"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id_usuario"]
          },
        ]
      }
      usuario_token: {
        Row: {
          dat_criacao: string
          data_criacao: string
          data_expiracao: string
          id_token: number
          id_usuario: number
          id_usuario_criador: number
          tipo_token: string
          token: string
          usado: boolean
        }
        Insert: {
          dat_criacao?: string
          data_criacao?: string
          data_expiracao?: string
          id_token?: number
          id_usuario: number
          id_usuario_criador?: number
          tipo_token?: string
          token: string
          usado?: boolean
        }
        Update: {
          dat_criacao?: string
          data_criacao?: string
          data_expiracao?: string
          id_token?: number
          id_usuario?: number
          id_usuario_criador?: number
          tipo_token?: string
          token?: string
          usado?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_user: {
        Args: { cpf_cnpj: string; senha: string }
        Returns: {
          email: string
          entity_id: number
          password_validated: string
          profile_id: number
          user_id: number
          user_status: string
        }[]
      }
      calculate_and_insert_indicators: {
        Args: { p_id_coleta: number }
        Returns: undefined
      }
      debug_authenticate_user: {
        Args: { cpf_cnpj_param: string; senha_param: string }
        Returns: {
          cpf_cnpj_db: string
          found_entities: number
          found_users: number
          locked_db: string
          senha_db: string
          status_db: string
          step: string
        }[]
      }
      debug_user_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          cpf_cnpj: string
          entity_id: number
          locked: string
          senha: string
          status: string
          user_id: number
        }[]
      }
      generate_user_token: {
        Args: { user_id_param: number }
        Returns: string
      }
      reset_user_password: {
        Args: { user_id_param: number }
        Returns: boolean
      }
      validate_user_password: {
        Args: { new_password: string; user_id: number }
        Returns: boolean
      }
      validate_user_token: {
        Args: { token_param: string; user_id_param: number }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
