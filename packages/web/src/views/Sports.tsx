import { useEffect, useState, type FormEvent } from 'react';
import {
    Box,
    Button,
    Center,
    Flex,
    HStack,
    Heading,
    Input,
    Spinner,
    Stack,
    Table,
    Text,
    Textarea,
    IconButton,
} from '@chakra-ui/react';
import { LuPencil, LuPlus, LuRefreshCw, LuSearch, LuTrash2 } from 'react-icons/lu';
import type { CreateSportRequest, SportDTO } from '@alentapp/shared';
import { sportsService } from '../services/sports';
import { Field } from '../components/ui/field';
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogActionTrigger,
    DialogCloseTrigger,
} from '../components/ui/dialog';

const initialFormData: CreateSportRequest = {
    name: '',
    description: '',
    max_capacity: 1,
    additional_price: 0,
    requires_medical_certificate: false,
};

const initialNumericFields = {
    max_capacity: '1',
    additional_price: '0',
};

export function SportsView() {
    const [sports, setSports] = useState<SportDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchName, setSearchName] = useState('');

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingSportId, setEditingSportId] = useState<string | null>(null);
    const [formData, setFormData] = useState<CreateSportRequest>(initialFormData);
    const [numericFields, setNumericFields] = useState(initialNumericFields);
    const [formError, setFormError] = useState<string | null>(null);

    const fetchSports = async (name?: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await sportsService.getAll(name);
            setSports(data);
        } catch (err: any) {
            setSports([]);
            setError(err.message || 'Error al cargar los deportes');
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingSportId(null);
        setFormData(initialFormData);
        setNumericFields(initialNumericFields);
        setFormError(null);
        setIsDialogOpen(true);
    };

    const openEditModal = (sport: SportDTO) => {
        setEditingSportId(sport.id);
        setFormData({
            name: sport.name,
            description: sport.description,
            max_capacity: sport.max_capacity,
            additional_price: sport.additional_price,
            requires_medical_certificate: sport.requires_medical_certificate,
        });
        setNumericFields({
            max_capacity: String(sport.max_capacity),
            additional_price: String(sport.additional_price),
        });
        setFormError(null);
        setIsDialogOpen(true);
    };

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();
        const normalizedName = searchName.trim();

        if (!normalizedName) {
            setError('Ingrese un nombre para buscar o use Actualizar para ver todos los deportes');
            return;
        }

        fetchSports(normalizedName);
    };

    const handleRefresh = () => {
        setSearchName('');
        fetchSports();
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setFormError(null);

        try {
            if (editingSportId) {
                await sportsService.update(editingSportId, {
                    description: formData.description,
                    max_capacity: Number(numericFields.max_capacity),
                });
            } else {
                await sportsService.create({
                    ...formData,
                    max_capacity: Number(numericFields.max_capacity),
                    additional_price: Number(numericFields.additional_price || 0),
                });
            }
            setIsDialogOpen(false);
            setEditingSportId(null);
            setFormData(initialFormData);
            setNumericFields(initialNumericFields);
            setSearchName('');
            fetchSports();
        } catch (err: any) {
            setFormError(err.message || 'Error al crear el deporte');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (sport: SportDTO) => {
        if (!window.confirm(`Estas seguro de que queres eliminar el deporte "${sport.name}"?`)) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await sportsService.delete(sport.id);
            fetchSports(searchName.trim() || undefined);
        } catch (err: any) {
            setError(err.message || 'Error al eliminar el deporte');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSports();
    }, []);

    return (
        <DialogRoot open={isDialogOpen} onOpenChange={(event) => setIsDialogOpen(event.open)}>
            <Stack gap="8" translate="no">
                <Flex justify="space-between" align="center" gap="4" wrap="wrap">
                    <Stack gap="1">
                        <Heading size="2xl" fontWeight="bold">Administracion de Deportes</Heading>
                        <Text color="fg.muted" fontSize="md">
                            Consulta y administra la oferta deportiva del club.
                        </Text>
                    </Stack>
                    <HStack gap="3">
                        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
                            <LuRefreshCw /> Actualizar
                        </Button>
                        <Button colorPalette="blue" size="md" onClick={openCreateModal}>
                            <LuPlus /> Agregar Deporte
                        </Button>
                    </HStack>
                </Flex>

                <Box as="form" onSubmit={handleSearch}>
                    <HStack gap="3" align="flex-end" maxW="xl">
                        <Field label="Buscar por nombre">
                            <Input
                                value={searchName}
                                onChange={(event) => setSearchName(event.target.value)}
                                placeholder="Ej. Tenis"
                            />
                        </Field>
                        <Button type="submit" variant="outline" disabled={isLoading}>
                            <LuSearch /> Buscar
                        </Button>
                    </HStack>
                </Box>

                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingSportId ? 'Editar Deporte' : 'Agregar Nuevo Deporte'}</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Stack gap="4">
                                {formError && (
                                    <Box p="3" bg="red.50" color="red.700" borderRadius="md" borderWidth="1px" borderColor="red.200">
                                        <Text fontSize="sm" fontWeight="medium">{formError}</Text>
                                    </Box>
                                )}

                                <Field label="Nombre" required>
                                    <Input
                                        value={formData.name}
                                        onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                                        placeholder="Ej. Tenis"
                                        disabled={Boolean(editingSportId)}
                                        required
                                    />
                                </Field>

                                <Field label="Descripcion" required>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                                        placeholder="Detalle de la actividad"
                                        required
                                    />
                                </Field>

                                <Field label="Cupo maximo" required>
                                    <Input
                                        type="number"
                                        min={1}
                                        step={1}
                                        value={numericFields.max_capacity}
                                        onChange={(event) => setNumericFields({
                                            ...numericFields,
                                            max_capacity: event.target.value,
                                        })}
                                        required
                                    />
                                </Field>

                                {!editingSportId && (
                                    <>
                                        <Field label="Precio adicional">
                                            <Input
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={numericFields.additional_price}
                                                onChange={(event) => setNumericFields({
                                                    ...numericFields,
                                                    additional_price: event.target.value,
                                                })}
                                            />
                                        </Field>

                                        <Box as="label" display="flex" alignItems="center" gap="2" fontSize="sm" fontWeight="medium">
                                            <input
                                                type="checkbox"
                                                checked={formData.requires_medical_certificate}
                                                onChange={(event) => setFormData({
                                                    ...formData,
                                                    requires_medical_certificate: event.target.checked,
                                                })}
                                            />
                                            Requiere certificado medico
                                        </Box>
                                    </>
                                )}
                            </Stack>
                        </DialogBody>
                        <DialogFooter>
                            <DialogActionTrigger asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogActionTrigger>
                            <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                                {editingSportId ? 'Guardar Cambios' : 'Crear Deporte'}
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
                                <Text color="fg.muted">Cargando deportes...</Text>
                            </Stack>
                        </Center>
                    ) : sports.length === 0 ? (
                        <Center h="300px">
                            <Stack align="center" gap="4">
                                <Text color="fg.muted">No se encontraron deportes.</Text>
                                <Button variant="ghost" onClick={handleRefresh}>Reintentar</Button>
                            </Stack>
                        </Center>
                    ) : (
                        <Table.Root size="md" variant="line" interactive>
                            <Table.Header>
                                <Table.Row bg="bg.muted/50">
                                    <Table.ColumnHeader py="4">Nombre</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">Descripcion</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">Cupo Maximo</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">Precio Adicional</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">Certificado Medico</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {sports.map((sport) => (
                                    <Table.Row key={sport.id} _hover={{ bg: 'bg.muted/30' }}>
                                        <Table.Cell fontWeight="semibold" color="fg.emphasized">
                                            {sport.name}
                                        </Table.Cell>
                                        <Table.Cell color="fg.muted">{sport.description}</Table.Cell>
                                        <Table.Cell color="fg.muted">{sport.max_capacity}</Table.Cell>
                                        <Table.Cell color="fg.muted">${sport.additional_price}</Table.Cell>
                                        <Table.Cell>
                                            <Box
                                                display="inline-block"
                                                px="2"
                                                py="0.5"
                                                borderRadius="md"
                                                bg={sport.requires_medical_certificate ? 'orange.50' : 'green.50'}
                                                color={sport.requires_medical_certificate ? 'orange.700' : 'green.700'}
                                                fontSize="xs"
                                                fontWeight="bold"
                                            >
                                                {sport.requires_medical_certificate ? 'Requerido' : 'No requerido'}
                                            </Box>
                                        </Table.Cell>
                                        <Table.Cell textAlign="end">
                                            <HStack gap="2" justify="flex-end">
                                                <IconButton
                                                    variant="ghost"
                                                    size="sm"
                                                    aria-label="Editar deporte"
                                                    onClick={() => openEditModal(sport)}
                                                >
                                                    <LuPencil />
                                                </IconButton>
                                                <IconButton
                                                    variant="ghost"
                                                    size="sm"
                                                    colorPalette="red"
                                                    aria-label="Eliminar deporte"
                                                    onClick={() => handleDelete(sport)}
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
