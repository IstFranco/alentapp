const API_URL = 'http://192.168.0.71:3000/api/v1/lockers';

export const lockerService = {
  // ACÁ LE AGREGAMOS EL CREATE (POST)
  createLocker: async (number: number, location: string) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ number, location }),
    });

    if (!response.ok) {
      throw new Error('Error al crear el casillero');
    }
    return response.json();
  },

  // Tu lógica de reserva por PATCH
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

  // Tu lógica de liberación por PATCH con cabecera
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
