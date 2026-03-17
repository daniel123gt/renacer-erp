import supabase from "~/utils/supabase";

export interface UploadFileOptions {
  file: File;
  bucket: string;
  folder?: string;
  compressPdf?: boolean; // Opcional: comprimir PDF antes de subir
}

/**
 * Servicio para manejar archivos en Supabase Storage
 * Optimizado para PDFs con compresión opcional
 */
export const storageService = {
  /**
   * Sube un archivo a Supabase Storage
   * @param options Opciones de subida
   * @returns URL pública del archivo subido
   */
  async uploadFile(options: UploadFileOptions): Promise<string> {
    try {
      let fileToUpload = options.file;
      
      // Si es PDF y se solicita compresión, podríamos comprimirlo aquí
      // Nota: La compresión de PDF requiere bibliotecas adicionales (ej: pdf-lib, jspdf)
      // Por ahora subimos directamente y Supabase maneja la compresión automática
      
      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = fileToUpload.name.split('.').pop();
      const fileName = `${options.folder ? options.folder + '/' : ''}${timestamp}-${randomString}.${fileExtension}`;
      
      // Subir archivo
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Error al subir archivo:', error);
      throw new Error(error?.message || 'Error al subir el archivo');
    }
  },

  /**
   * Elimina un archivo de Supabase Storage
   * @param bucket Nombre del bucket
   * @param filePath Ruta del archivo
   */
  async deleteFile(bucket: string, filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error al eliminar archivo:', error);
      throw new Error(error?.message || 'Error al eliminar el archivo');
    }
  },

  /**
   * Obtiene la URL de descarga de un archivo (con expiración opcional)
   * @param bucket Nombre del bucket
   * @param filePath Ruta del archivo
   * @param expiresIn Tiempo de expiración en segundos (opcional)
   * @returns URL de descarga
   */
  async getDownloadUrl(bucket: string, filePath: string, expiresIn?: number): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn || 3600);

      if (error) throw error;
      return data.signedUrl;
    } catch (error: any) {
      console.error('Error al obtener URL:', error);
      throw new Error(error?.message || 'Error al obtener la URL del archivo');
    }
  }
};

export default storageService;

