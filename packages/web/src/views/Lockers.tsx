import React, { useState } from 'react';
import { Box, Heading, Text, SimpleGrid, Badge, Button, VStack, HStack, Input } from "@chakra-ui/react";
import { lockerService } from '../services/lockers';

interface Locker {
  id: string;
  number: number;
  location: string;
  status: 'Available' | 'Occupied' | 'Maintenance';
  member_id: string | null;
}

export function LockersView() {
  // Estado local con el casillero 105 base de prueba
  const [lockers, setLockers] = useState<Locker[]>([
    {
      id: "67615b93-c42d-4bcf-9093-4b478febe73e",
      number: 105,
      location: "Sector Canchas",
      status: "Available",
      member_id: null
    }
  ]);
  
  // Estados para manejar el formulario de Alta
  const [newNumber, setNewNumber] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const SIMULATED_MEMBER_ID = "00000000-0000-0000-0000-000000000001";

  // Función que llama al createLocker del servicio
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber || !newLocation) return alert("Por favor completá todos los campos");

    setLoading(true);
    try {
      const createdLocker = await lockerService.createLocker(Number(newNumber), newLocation);
      
      // Sumamos el casillero real creado por la API al estado de la pantalla
      setLockers([...lockers, createdLocker]);
      
      // Limpiamos los inputs
      setNewNumber('');
      setNewLocation('');
      alert("¡Casillero creado con éxito!");
    } catch (error) {
      alert("Error al dar de alta el casillero");
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (id: string) => {
    setLoading(true);
    try {
      await lockerService.reserveLocker(id, SIMULATED_MEMBER_ID);
      setLockers(lockers.map(l => l.id === id ? { ...l, status: 'Occupied', member_id: SIMULATED_MEMBER_ID } : l));
      alert("¡Casillero reservado!");
    } catch (error) {
      alert("Error al reservar");
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (id: string) => {
    setLoading(true);
    try {
      await lockerService.releaseLocker(id, SIMULATED_MEMBER_ID);
      setLockers(lockers.map(l => l.id === id ? { ...l, status: 'Available', member_id: null } : l));
      alert("¡Casillero liberado!");
    } catch (error) {
      alert("Error al liberar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p="6">
      <VStack gap="2" align="flex-start" mb="8">
        <Heading size="2xl" fontWeight="bold" color="blue.600">Panel de Casilleros</Heading>
        <Text color="fg.muted">Administrá y controlá las reservas de los casilleros del club en tiempo real.</Text>
      </VStack>

      {/* FORMULARIO DE ALTA */}
      <Box as="form" onSubmit={handleCreate} p="6" borderWidth="1px" borderRadius="2xl" bg="bg.panel" shadow="sm" mb="10" maxW="xl">
        <Heading size="md" mb="4">➕ Dar de Alta Nuevo Casillero</Heading>
        <VStack gap="4" align="stretch">
          <HStack gap="4">
            <Box flex="1">
              <Text fontSize="sm" fontWeight="medium" mb="1" color="fg.muted">Número</Text>
              <Input 
                type="number" 
                placeholder="Ej: 106" 
                value={newNumber} 
                onChange={(e) => setNewNumber(e.target.value)}
              />
            </Box>
            <Box flex="2">
              <Text fontSize="sm" fontWeight="medium" mb="1" color="fg.muted">Ubicación</Text>
              <Input 
                type="text" 
                placeholder="Ej: Vestuarios" 
                value={newLocation} 
                onChange={(e) => setNewLocation(e.target.value)}
              />
            </Box>
          </HStack>
          <Button type="submit" colorScheme="blue" isLoading={loading} alignSelf="flex-end" px="6">
            Crear Casillero
          </Button>
        </VStack>
      </Box>
      
      {/* GRILLA DE TARJETAS */}
      <Heading size="md" mb="4">📋 Lista de Casilleros</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="6">
        {lockers.map((locker) => (
          <Box key={locker.id} p="5" borderWidth="1px" borderRadius="2xl" bg="bg.panel" shadow="sm" display="flex" flexDirection="column" justifyContent="space-between">
            <VStack align="stretch" gap="3">
              <HStack justifyContent="space-between">
                <Text fontSize="xl" fontWeight="bold">Casillero #{locker.number}</Text>
                <Badge colorScheme={locker.status === 'Available' ? 'green' : 'red'} borderRadius="full" px="3">
                  {locker.status === 'Available' ? 'Disponible' : 'Ocupado'}
                </Badge>
              </HStack>
              <Text fontSize="sm" color="fg.muted">📍 Ubicación: {locker.location}</Text>
              {locker.member_id && (
                <Box bg="bg.muted/50" p="2" borderRadius="md">
                  <Text fontSize="xs" color="fg.muted" isTruncated>👤 Socio: {locker.member_id}</Text>
                </Box>
              )}
              
              <Box mt="4">
                {locker.status === 'Available' ? (
                  <Button isLoading={loading} colorScheme="blue" w="full" onClick={() => handleReserve(locker.id)}>
                    Reservar Casillero
                  </Button>
                ) : (
                  <Button isLoading={loading} colorScheme="gray" w="full" onClick={() => handleRelease(locker.id)}>
                    Liberar Casillero
                  </Button>
                )}
              </Box>
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
