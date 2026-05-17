const API_URL = 'http://192.168.0.71:3000/api/v1/lockers';

export const lockerService = {
  // Método para crear (POST)
  createLocker: async (number: number, location: string) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number, location }),
    });
    if (!response.ok) throw new Error('Error al crear el casillero');
    return response.json();
  },

  // Para reservar (PATCH)
  reserveLocker: async (id: string, memberId: string) => {
    const response = await fetch(`${API_URL}/${id}/reserve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId }),
    });
    if (!response.ok) throw new Error('Error al reservar el casillero');
    return response.json();
  },

  // Para liberar (PATCH)
  releaseLocker: async (id: string, memberId: string) => {
    const response = await fetch(`${API_URL}/${id}/release`, {
      method: 'PATCH',
      headers: { 'x-user-id': memberId },
    });
    if (!response.ok) throw new Error('Error al liberar el casillero');
    return response.json();
  },

  // NUEVO: Método para eliminar un casillero (DELETE)
  deleteLocker: async (id: string) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar el casillero');
    return response.json(); // O simplemente return true si el backend devuelve un 204 sin cuerpo
  }
};
