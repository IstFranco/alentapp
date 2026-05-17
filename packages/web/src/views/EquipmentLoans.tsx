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
    Badge,
    Input
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw } from "react-icons/lu";
import { useEffect, useState } from "react";
import { equipmentLoansService } from "../services/equipment-loans";
import type { EquipmentLoanResponseDto, CreateEquipmentLoanRequestDto } from "@alentapp/shared/dtos/equipment-loan.dto";
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

export function EquipmentLoansView() {
    const [loans, setLoans] = useState<EquipmentLoanResponseDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createFormData, setCreateFormData] = useState<CreateEquipmentLoanRequestDto>({
        itemName: "",
        memberDni: "",
        notes: "",
    });

    const [loanToReturn, setLoanToReturn] = useState<EquipmentLoanResponseDto | null>(null);
    const [isDamaged, setIsDamaged] = useState(false);
    const [returnNotes, setReturnNotes] = useState("");

    const [loanToCancel, setLoanToCancel] = useState<EquipmentLoanResponseDto | null>(null);
    const [cancelReason, setCancelReason] = useState("");

    const fetchLoans = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await equipmentLoansService.getAll();
            setLoans(data);
        } catch (err: any) {
            setError(err.message || "Error al cargar los préstamos");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, []);

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await equipmentLoansService.create(createFormData);
            setIsCreateDialogOpen(false);
            fetchLoans();
        } catch (err: any) {
            alert(err.message || "Error al registrar el préstamo");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReturnSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loanToReturn) return;
        
        if (isDamaged && returnNotes.trim().length < 10) {
            alert("Si el material está dañado, las notas explicativas deben tener al menos 10 caracteres.");
            return;
        }

        setIsSubmitting(true);
        try {
            await equipmentLoansService.returnLoan(loanToReturn.id, {
                status: isDamaged ? 'Damaged' : 'Returned',
                notes: returnNotes.trim() || undefined,
            });
            setLoanToReturn(null);
            fetchLoans();
        } catch (err: any) {
            alert(err.message || "Error al devolver el equipamiento");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loanToCancel) return;
        setIsSubmitting(true);
        try {
            await equipmentLoansService.cancelLoan(loanToCancel.id, {
                reason: cancelReason.trim() || undefined,
            });
            setLoanToCancel(null);
            fetchLoans();
        } catch (err: any) {
            alert(err.message || "Error al cancelar el préstamo");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Loaned': return <Badge colorPalette="blue" variant="solid" borderRadius="md" px="2">Prestado</Badge>;
            case 'Returned': return <Badge colorPalette="green" variant="solid" borderRadius="md" px="2">Devuelto</Badge>;
            case 'Damaged': return <Badge colorPalette="orange" variant="solid" borderRadius="md" px="2">Roto</Badge>;
            case 'Canceled': return <Badge colorPalette="red" variant="solid" borderRadius="md" px="2">Cancelado</Badge>;
            default: return <Badge colorPalette="gray" variant="solid" borderRadius="md" px="2">{status}</Badge>;
        }
    };

    return (
        <Stack gap="8" p="2">
            <Flex justify="space-between" align="center">
                <Stack gap="1">
                    <Heading size="2xl" fontWeight="bold">Préstamos de Equipamiento</Heading>
                    <Text color="fg.muted" fontSize="md">Gestiona los préstamos de material deportivo, devoluciones y bajas lógicas.</Text>
                </Stack>
                <HStack gap="3">
                    <Button variant="outline" onClick={fetchLoans} disabled={isLoading}>
                        <LuRefreshCw /> Actualizar
                    </Button>
                    <Button colorPalette="blue" size="md" onClick={() => { setCreateFormData({ itemName: "", memberDni: "", notes: "" }); setIsCreateDialogOpen(true); }}>
                        <LuPlus /> Registrar Préstamo
                    </Button>
                </HStack>
            </Flex>

            {error && (
                <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
                    <Text fontWeight="bold">Error:</Text>
                    <Text>{error}</Text>
                </Box>
            )}

            <DialogRoot open={isCreateDialogOpen} onOpenChange={(e) => setIsCreateDialogOpen(e.open)}>
                <DialogContent>
                    <form onSubmit={handleCreateSubmit}>
                        <DialogHeader><DialogTitle>Registrar Nuevo Préstamo</DialogTitle></DialogHeader>
                        <DialogBody>
                            <Stack gap="4">
                                <Field label="Nombre del Equipamiento" required>
                                    <Input placeholder="Ej. Paleta de Pádel" value={createFormData.itemName} onChange={(e) => setCreateFormData({ ...createFormData, itemName: e.target.value })} required />
                                </Field>
                                <Field label="DNI del Socio" required>
                                    <Input placeholder="Ej. 45123456" value={createFormData.memberDni} onChange={(e) => setCreateFormData({ ...createFormData, memberDni: e.target.value })} required />
                                </Field>
                                <Field label="Notas / Observaciones">
                                    <Input placeholder="Ej. Prestado con funda" value={createFormData.notes} onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })} />
                                </Field>
                            </Stack>
                        </DialogBody>
                        <DialogFooter>
                            <DialogActionTrigger asChild><Button variant="outline">Cancelar</Button></DialogActionTrigger>
                            <Button type="submit" colorPalette="blue" loading={isSubmitting}>Crear Préstamo</Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                    </form>
                </DialogContent>
            </DialogRoot>

            <DialogRoot open={!!loanToReturn} onOpenChange={(e) => !e.open && setLoanToReturn(null)}>
                <DialogContent>
                    <form onSubmit={handleReturnSubmit}>
                        <DialogHeader><DialogTitle>Devolver Equipamiento</DialogTitle></DialogHeader>
                        <DialogBody>
                            <Stack gap="4">
                                <Text>¿En qué estado se devuelve <strong>{loanToReturn?.itemName}</strong>?</Text>
                                <HStack gap="4">
                                    <Button variant={!isDamaged ? "solid" : "outline"} colorPalette="green" onClick={() => setIsDamaged(false)} flex="1">Buen Estado</Button>
                                    <Button variant={isDamaged ? "solid" : "outline"} colorPalette="orange" onClick={() => setIsDamaged(true)} flex="1">Dañado / Roto</Button>
                                </HStack>
                                <Field label={isDamaged ? "Descripción del daño (Obligatorio, min 10 carácteres)" : "Notas adicionales (Opcional)"}>
                                    <Input placeholder={isDamaged ? "Describí qué se rompió.. (OBLIGATORIO!)." : "Todo en orden..."} value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} required={isDamaged} />
                                </Field>
                            </Stack>
                        </DialogBody>
                        <DialogFooter>
                            <DialogActionTrigger asChild><Button variant="outline">Cancelar</Button></DialogActionTrigger>
                            <Button type="submit" colorPalette={isDamaged ? "orange" : "green"} loading={isSubmitting}>Confirmar Devolución</Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                    </form>
                </DialogContent>
            </DialogRoot>

            <DialogRoot open={!!loanToCancel} onOpenChange={(e) => !e.open && setLoanToCancel(null)}>
                <DialogContent>
                    <form onSubmit={handleCancelSubmit}>
                        <DialogHeader><DialogTitle>Cancelar Préstamo</DialogTitle></DialogHeader>
                        <DialogBody>
                            <Stack gap="4">
                                <Text>Vas a cancelar y anular el préstamo de <strong>{loanToCancel?.itemName}</strong>. Esta acción lo removerá de los activos.</Text>
                                <Field label="Motivo de cancelación (Opcional)">
                                    <Input placeholder="Ej. Se cargó por error" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                                </Field>
                            </Stack>
                        </DialogBody>
                        <DialogFooter>
                            <DialogActionTrigger asChild><Button variant="outline">Volver</Button></DialogActionTrigger>
                            <Button type="submit" colorPalette="red" loading={isSubmitting}>Sí, anular préstamo</Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                    </form>
                </DialogContent>
            </DialogRoot>

            <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" overflow="hidden" minH="300px" position="relative">
                {isLoading ? (
                    <Center h="300px"><Stack align="center" gap="4"><Spinner size="xl" color="blue.500" /><Text color="fg.muted">Cargando préstamos...</Text></Stack></Center>
                ) : loans.length === 0 ? (
                    <Center h="300px"><Stack align="center" gap="4"><Text color="fg.muted">No se encontraron préstamos registrados.</Text><Button variant="ghost" onClick={fetchLoans}>Reintentar</Button></Stack></Center>
                ) : (
                    <Table.Root size="md" variant="line" interactive>
                        <Table.Header>
                            <Table.Row bg="bg.muted/50">
                                <Table.ColumnHeader py="4">Equipamiento</Table.ColumnHeader>
                                <Table.ColumnHeader py="4">ID Socio</Table.ColumnHeader>
                                <Table.ColumnHeader py="4">Fecha Préstamo</Table.ColumnHeader>
                                <Table.ColumnHeader py="4">Fecha Devolución</Table.ColumnHeader>
                                <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                                <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {loans.map((loan) => (
                                <Table.Row key={loan.id} _hover={{ bg: "bg.muted/30" }}>
                                    <Table.Cell fontWeight="semibold" color="fg.emphasized">{loan.itemName}</Table.Cell>
                                    <Table.Cell color="fg.muted" fontSize="sm" title={loan.memberId}>{loan.memberId.slice(0, 8)}...</Table.Cell>
                                    <Table.Cell color="fg.muted">{new Date(loan.loanDate).toLocaleDateString('es-AR')}</Table.Cell>
                                    <Table.Cell color="fg.muted">{loan.returnDate ? new Date(loan.returnDate).toLocaleDateString('es-AR') : '-'}</Table.Cell>
                                    <Table.Cell>{getStatusBadge(loan.status)}</Table.Cell>
                                    <Table.Cell textAlign="end">
                                        <HStack gap="2" justify="flex-end">
                                            {loan.status === 'Loaned' ? (
                                                <>
                                                    <Button 
                                                        size="sm" 
                                                        h="7"
                                                        px="3"
                                                        fontSize="xs"
                                                        variant="outline" 
                                                        colorPalette="green" 
                                                        onClick={() => { setLoanToReturn(loan); setIsDamaged(false); setReturnNotes(""); }}
                                                    >
                                                        Devolver
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        h="7" 
                                                        px="3"
                                                        fontSize="xs"
                                                        variant="outline" 
                                                        colorPalette="red" 
                                                        onClick={() => { setLoanToCancel(loan); setCancelReason(""); }}
                                                    >
                                                        Cancelar
                                                    </Button>
                                                </>
                                            ) : (
                                                <Text fontSize="xs" color="fg.muted" pr="4">Finalizado</Text>
                                            )}
                                        </HStack>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                )}
            </Box>
        </Stack>
    );
}