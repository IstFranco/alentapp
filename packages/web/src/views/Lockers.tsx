import React, { useState } from 'react';
import { Box, Heading, Text, SimpleGrid, Badge, Button, VStack, HStack } from "@chakra-ui/react";
import { lockerService } from '../services/lockers';

interface Locker {
  id: string;
  number: number;
  location: string;
  status: 'Available' | 'Occupied' | 'Maintenance';
  member_id: string | null;
}

export function LockersView() {
  const [lockers, setLockers] = useState<Locker[]>([
    {
      id: "67615b93-c42d-4bcf-9093-4b478febe73e",
      number: 105,
      location: "Sector Canchas",
      status: "Available",
      member_id: null
    }
  ]);
  const [loading, setLoading] = useState(false);

  const SIMULATED_MEMBER_ID = "00000000-0000-0000-0000-000000000001";

  const handleReserve = async (id: string) => {
    setLoading(true);
    try {
      await lockerService.reserveLocker(id, SIMULATED_MEMBER_ID);
      setLockers(lockers.map(l => l.id === id ? { ...l, status: 'Occupied', member_id: SIMULATED_MEMBER_ID } : l));
      alert("¡Casillero reservado con éxito!");
    } catch (error) {
      alert("Error al reservar el casillero");
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (id: string) => {
    setLoading(true);
    try {
      await lockerService.releaseLocker(id, SIMULATED_MEMBER_ID);
      setLockers(lockers.map(l => l.id === id ? { ...l, status: 'Available', member_id: null } : l));
      alert("¡Casillero liberado correctamente!");
    } catch (error) {
      alert("Error al liberar el casillero");
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
