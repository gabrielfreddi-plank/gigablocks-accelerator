export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: { id: string; nome: string | null; created_at: string; updated_at: string }
        Insert: { id: string; nome?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; nome?: string | null; created_at?: string; updated_at?: string }
      }
      empresas: {
        Row: { id: string; nome: string; usuario_id: string; created_at: string; updated_at: string }
        Insert: { id?: string; nome: string; usuario_id?: string; created_at?: string; updated_at?: string }
        Update: { id?: string; nome?: string; usuario_id?: string; created_at?: string; updated_at?: string }
      }
      empresa_membros: {
        Row: { empresa_id: string; usuario_id: string; role: string; created_at: string }
        Insert: { empresa_id: string; usuario_id: string; role?: string; created_at?: string }
        Update: { empresa_id?: string; usuario_id?: string; role?: string; created_at?: string }
      }
      documentos: {
        Row: {
          id: string
          nome: string
          conteudo_original: string | null
          empresa_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          conteudo_original?: string | null
          empresa_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          conteudo_original?: string | null
          empresa_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
  }
}
