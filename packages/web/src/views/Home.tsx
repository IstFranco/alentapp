import { Box, SimpleGrid, Heading, Text, VStack } from "@chakra-ui/react";
import { LuUsers, LuLayers, LuFileText } from "react-icons/lu";
import { SectionCard } from "../components/SectionCard";

export function HomeView() {
  return (
    <Box>
      <VStack gap="6" align="flex-start" mb="12">
        <Heading 
          size="4xl" 
          fontWeight="extrabold" 
          letterSpacing="tight"
          bgGradient="to-r"
          gradientFrom="blue.600"
          gradientTo="cyan.400"
          bgClip="text"
        >
          Bienvenido a Alentapp
        </Heading>
        <Text fontSize="xl" color="fg.muted" maxW="2xl">
          El panel de administración central para gestionar todos los aspectos de tu club. 
          Selecciona una sección a continuación para comenzar.
        </Text>
      </VStack>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="8">
        {/* Tarjeta oficial de Miembros de tus amigos */}
        <SectionCard 
          title="Miembros"
          description="Administra el padrón de socios, sus categorías, estados de cuenta y datos personales."
          to="/members"
          icon={LuUsers}
        />

        <SectionCard 
          title="Préstamos"
          description="Controlá el préstamo de material deportivo, devoluciones en buen estado, roturas y cancelaciones."
          to="/equipment-loans"
          icon={LuUsers}/* no tengo icono todavia, de dejo el de miembros por defecto*/
        />

        {/* Future sections can be added here following the same pattern */}
        {/* Tu nueva sección integrada impecable */}
        <SectionCard 
          title="Casilleros"
          description="Gestioná la asignación, reserva, mantenimiento y liberación de casilleros en las sedes."
          to="/lockers"
          icon={LuLayers}
        />

        <SectionCard 
          title="Certificados Médicos"
          description="Administra los certificados médicos de los socios, su estado de validación y vigencia."
          to="/medical-certificates"
          icon={LuFileText}
        />

        {/* Secciones futuras en estado dashed */}
        <Box 
          p="6" 
          bg="bg.muted/30" 
          borderRadius="2xl" 
          borderWidth="1px" 
          borderColor="border.subtle"
          borderStyle="dashed"
          display="flex"
          alignItems="center"
          justifyContent="center"
          minH="250px"
        >
          <VStack>
            <Text color="fg.muted" fontWeight="medium">Próximamente nuevas secciones</Text>
          </VStack>
        </Box>
      </SimpleGrid>
    </Box>
  );
}
