import { 
    Table, 
    Button, 
    Heading, 
    HStack, 
    Stack, 
    Text, 
    Box,
    Flex,
    Spinner,
    Center,
    Input,
    IconButton,
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw, LuCheck, LuTrash2} from "react-icons/lu";
import { useEffect, useState } from "react";
import { medicalCertificatesService } from "../services/medicalCertificates";
import { membersService } from "../services/members";
import type { MedicalCertificateDTO, CreateMedicalCertificateRequest, MemberDTO } from "@alentapp/shared";
import { 
    DialogRoot, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogBody, 
    DialogFooter, 
    DialogActionTrigger,
    DialogCloseTrigger
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import { 
    SelectRoot, 
    SelectTrigger, 
    SelectValueText, 
    SelectContent, 
    SelectItem, 
    createListCollection 
} from "../components/ui/select";

export function MedicalCertificatesView() {
    const [certificates, setCertificates] = useState<MedicalCertificateDTO[]>([]);
    const [members, setMembers] = useState<MemberDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estado del modal
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estado del formulario
    const [formData, setFormData] = useState<CreateMedicalCertificateRequest>({
        memberId: "",
        issueDate: "",
        expiryDate: "",
        doctorLicense: "",
    });

    // Collection de socios para el dropdown
    const membersCollection = createListCollection({
        items: members.map((m) => ({
        label: `${m.name} (DNI: ${m.dni})`,
        value: m.id,
        })),
    });

    const fetchCertificates = async () => {
        setIsLoading(true);
        setError(null);
        try {
        const data = await medicalCertificatesService.getAll();
        setCertificates(data);
        } catch (err: any) {
        setError(err.message || "Error al cargar los certificados médicos");
        } finally {
        setIsLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
        const data = await membersService.getAll();
        setMembers(data);
        } catch (err: any) {
        // No mostramos error si falla el listado de socios, solo lo logueamos
        console.error("Error al cargar socios:", err.message);
        }
    };

    const openCreateModal = () => {
        setFormData({ memberId: "", issueDate: "", expiryDate: "", doctorLicense: "" });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
        await medicalCertificatesService.create(formData);
        setIsDialogOpen(false);
        fetchCertificates();
        } catch (err: any) {
        alert(err.message || "Error al crear el certificado médico");
        } finally {
        setIsSubmitting(false);
        }
    };

    const handleValidate = async (id: string) => {
        if (!window.confirm("¿Confirmás que querés validar este certificado médico?")) {
            return;
        }
        try {
            await medicalCertificatesService.update(id, { isValidated: true });
            fetchCertificates();
        } catch (err: any) {
            alert(err.message || "Error al validar el certificado");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Estás seguro de que querés eliminar este certificado médico? Esta acción no se puede deshacer desde la interfaz.")) {
            return;
        }
        try {
            await medicalCertificatesService.delete(id);
            fetchCertificates();
        } catch (err: any) {
            alert(err.message || "Error al eliminar el certificado médico");
        }
    };

    useEffect(() => {
        fetchCertificates();
        fetchMembers();
    }, []);

    return (
        <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
        <Stack gap="8">
            <Flex justify="space-between" align="center">
            <Stack gap="1">
                <Heading size="2xl" fontWeight="bold">Certificados Médicos</Heading>
                <Text color="fg.muted" fontSize="md">
                Gestiona los certificados médicos de los socios del club.
                </Text>
            </Stack>
            <HStack gap="3">
                <Button variant="outline" onClick={fetchCertificates} disabled={isLoading}>
                <LuRefreshCw /> Actualizar
                </Button>
                <Button colorPalette="blue" size="md" onClick={openCreateModal}>
                <LuPlus /> Agregar Certificado
                </Button>
            </HStack>
            </Flex>

            {/* Modal para crear certificado */}
            <DialogContent>
            <form onSubmit={handleSubmit}>
                <DialogHeader>
                <DialogTitle>Agregar Nuevo Certificado Médico</DialogTitle>
                </DialogHeader>
                <DialogBody>
                <Stack gap="4">
                    <Field label="Socio" required>
                    <SelectRoot 
                        collection={membersCollection} 
                        value={formData.memberId ? [formData.memberId] : []}
                        onValueChange={(e) => setFormData({ ...formData, memberId: e.value[0] || "" })}
                    >
                        <SelectTrigger>
                        <SelectValueText placeholder="Seleccione un socio" />
                        </SelectTrigger>
                        <SelectContent>
                        {membersCollection.items.map((member) => (
                            <SelectItem item={member} key={member.value}>
                            {member.label}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </SelectRoot>
                    </Field>
                    <Field label="Fecha de Emisión" required>
                    <Input 
                        type="date" 
                        value={formData.issueDate}
                        onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                        required
                    />
                    </Field>
                    <Field label="Fecha de Vencimiento" required>
                    <Input 
                        type="date" 
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        required
                    />
                    </Field>
                    <Field label="Matrícula Médica" required>
                    <Input 
                        placeholder="Ej. MN-12345" 
                        value={formData.doctorLicense}
                        onChange={(e) => setFormData({ ...formData, doctorLicense: e.target.value })}
                        required
                    />
                    </Field>
                </Stack>
                </DialogBody>
                <DialogFooter>
                <DialogActionTrigger asChild>
                    <Button variant="outline">Cancelar</Button>
                </DialogActionTrigger>
                <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                    Crear Certificado
                </Button>
                </DialogFooter>
                <DialogCloseTrigger />
            </form>
            </DialogContent>

            {error && (
            <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
                <Text fontWeight="bold">Error:</Text>
                <Text>{error}</Text>
            </Box>
            )}

            <Box 
            bg="bg.panel" 
            borderRadius="xl" 
            boxShadow="sm" 
            borderWidth="1px" 
            overflow="hidden"
            minH="300px"
            position="relative"
            >
            {isLoading ? (
                <Center h="300px">
                <Stack align="center" gap="4">
                    <Spinner size="xl" color="blue.500" />
                    <Text color="fg.muted">Cargando certificados...</Text>
                </Stack>
                </Center>
            ) : certificates.length === 0 ? (
                <Center h="300px">
                <Stack align="center" gap="4">
                    <Text color="fg.muted">No se encontraron certificados médicos.</Text>
                    <Button variant="ghost" onClick={fetchCertificates}>Reintentar</Button>
                </Stack>
                </Center>
            ) : (
                <Table.Root size="md" variant="line" interactive>
                <Table.Header>
                    <Table.Row bg="bg.muted/50">
                        <Table.ColumnHeader py="4">Socio (ID)</Table.ColumnHeader>
                        <Table.ColumnHeader py="4">Fecha Emisión</Table.ColumnHeader>
                        <Table.ColumnHeader py="4">Fecha Vencimiento</Table.ColumnHeader>
                        <Table.ColumnHeader py="4">Matrícula Médica</Table.ColumnHeader>
                        <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                        <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {certificates.map((cert) => (
                    <Table.Row key={cert.id} _hover={{ bg: "bg.muted/30" }}>
                        <Table.Cell fontWeight="semibold" color="fg.emphasized" fontSize="xs" fontFamily="mono">
                        {cert.memberId}
                        </Table.Cell>
                        <Table.Cell color="fg.muted">{cert.issueDate}</Table.Cell>
                        <Table.Cell color="fg.muted">{cert.expiryDate}</Table.Cell>
                        <Table.Cell color="fg.muted">{cert.doctorLicense}</Table.Cell>
                        <Table.Cell>
                        <Box 
                            display="inline-block" 
                            px="2" 
                            py="0.5" 
                            borderRadius="md" 
                            bg={cert.isValidated ? 'green.50' : 'orange.50'} 
                            color={cert.isValidated ? 'green.700' : 'orange.700'} 
                            fontSize="xs" 
                            fontWeight="bold"
                        >
                            {cert.isValidated ? 'Validado' : 'Pendiente'}
                        </Box>
                        </Table.Cell>
                        <Table.Cell textAlign="end">
                            <HStack gap="2" justify="flex-end">
                                {!cert.isValidated && (
                                    <IconButton 
                                        variant="ghost" 
                                        size="sm" 
                                        colorPalette="green"
                                        aria-label="Validar certificado"
                                        onClick={() => handleValidate(cert.id)}
                                    >
                                    <LuCheck />
                                </IconButton>
                                )}
                                <IconButton 
                                    variant="ghost" 
                                    size="sm" 
                                    colorPalette="red"
                                    aria-label="Eliminar certificado"
                                    onClick={() => handleDelete(cert.id)}
                                >
                                    <LuTrash2 />
                                </IconButton>
                            </HStack>
                        </Table.Cell>
                    </Table.Row>
                    ))}
                </Table.Body>
                </Table.Root>
            )}
            </Box>
        </Stack>
        </DialogRoot>
    );
}