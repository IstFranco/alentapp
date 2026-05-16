const API_URL = 'http://192.168.0.71:3000/api/v1/lockers';

export const lockerService = {
  // Para reservar el casillero (PATCH)
  reserveLocker: async (id: string, memberId: string) => {
    const response = await fetch(`${API_URL}/${id}/reserve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ member_id: memberId }),
    });

    if (!response.ok) {
      throw new Error('Error al reservar el casillero');
    }
    return response.json();
  },

  // Para liberar el casillero (PATCH con cabecera)
  releaseLocker: async (id: string, memberId: string) => {
    const response = await fetch(`${API_URL}/${id}/release`, {
      method: 'PATCH',
      headers: {
        'x-user-id': memberId,
      },
    });

    if (!response.ok) {
      throw new Error('Error al liberar el casillero');
    }
    return response.json();
  }
};
