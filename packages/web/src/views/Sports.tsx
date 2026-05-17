import { useState, type FormEvent } from 'react';
import { Box, Button, Flex, Heading, Input, Stack, Text, Textarea } from '@chakra-ui/react';
import { LuPlus } from 'react-icons/lu';
import type { CreateSportRequest, SportDTO } from '@alentapp/shared';
import { sportsService } from '../services/sports';
import { Field } from '../components/ui/field';

export function SportsView() {
    const [createdSports, setCreatedSports] = useState<SportDTO[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [formData, setFormData] = useState<CreateSportRequest>({
        name: '',
        description: '',
        max_capacity: 1,
        additional_price: 0,
        requires_medical_certificate: false,
    });

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setFeedback(null);

        try {
            const created = await sportsService.create(formData);
            setCreatedSports((current) => [created, ...current]);
            setFormData({
                name: '',
                description: '',
                max_capacity: 1,
                additional_price: 0,
                requires_medical_certificate: false,
            });
            setFeedback({ type: 'success', message: 'Deporte creado con exito' });
        } catch (error: any) {
            setFeedback({ type: 'error', message: error.message || 'Error al crear el deporte' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Stack gap="8" translate="no">
            <Flex justify="space-between" align="center">
                <Stack gap="1">
                    <Heading size="2xl" fontWeight="bold">Deportes</Heading>
                    <Text color="fg.muted">Gestiona el alta de disciplinas deportivas del club.</Text>
                </Stack>
            </Flex>

            <Box as="form" onSubmit={handleSubmit} bg="bg.panel" borderWidth="1px" borderRadius="xl" p="6" maxW="2xl">
                <Stack gap="4">
                    <Box
                        minH="44px"
                        p="3"
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={feedback ? (feedback.type === 'success' ? 'green.200' : 'red.200') : 'transparent'}
                        bg={feedback ? (feedback.type === 'success' ? 'green.50' : 'red.50') : 'transparent'}
                        color={feedback ? (feedback.type === 'success' ? 'green.700' : 'red.700') : 'transparent'}
                    >
                        <Text fontSize="sm" fontWeight="medium">
                            {feedback?.message || ' '}
                        </Text>
                    </Box>

                    <Field label="Nombre" required>
                        <Input
                            value={formData.name}
                            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                            placeholder="Ej. Tenis"
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
                            value={formData.max_capacity}
                            onChange={(event) => setFormData({
                                ...formData,
                                max_capacity: Number(event.target.value) || 1,
                            })}
                            required
                        />
                    </Field>

                    <Field label="Precio adicional">
                        <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={formData.additional_price ?? 0}
                            onChange={(event) => setFormData({
                                ...formData,
                                additional_price: Number(event.target.value) || 0,
                            })}
                        />
                    </Field>

                    <Box
                        as="label"
                        display="flex"
                        alignItems="center"
                        gap="2"
                        fontSize="sm"
                        fontWeight="medium"
                    >
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

                    <Button type="submit" colorPalette="blue" loading={isSubmitting} alignSelf="flex-end">
                        <LuPlus /> Crear Deporte
                    </Button>
                </Stack>
            </Box>

            <Stack gap="3" minH="120px">
                <Heading size="md">Ultimos deportes creados</Heading>
                {createdSports.length === 0 ? (
                    <Box borderWidth="1px" borderRadius="lg" p="4" bg="bg.panel">
                        <Text color="fg.muted">Todavia no se crearon deportes desde esta pantalla.</Text>
                    </Box>
                ) : (
                    createdSports.map((sport) => (
                        <Box key={sport.id} borderWidth="1px" borderRadius="lg" p="4" bg="bg.panel">
                            <Text fontWeight="bold">{sport.name}</Text>
                            <Text color="fg.muted">{sport.description}</Text>
                            <Text fontSize="sm" color="fg.muted">
                                Cupo: {sport.max_capacity} | Precio adicional: ${sport.additional_price}
                            </Text>
                        </Box>
                    ))
                )}
            </Stack>
        </Stack>
    );
}
