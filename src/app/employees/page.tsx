"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppStore } from "@/hooks/use-app-store";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ScrollArea } from "@/components/ui/scroll-area";
import AppSidebar from "@/components/app-sidebar";
import { useToast } from "@/hooks/use-toast";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  Users,
  PlusCircle,
  Edit,
  Trash2,
} from "lucide-react";

import type { Employee } from "@/types";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


// ======================================
//   SCHEMA
// ======================================

const ROLES = [
  "Administrador",
  "Mesero/a",
  "Ayudante",
  "Cocinero/a",
  "Trabajador Operativo",
  "Recursos Humanos",
] as const;

const employeeSchema = z.object({
  name: z.string().min(3, {
    message: "El nombre debe tener al menos 3 caracteres.",
  }),
  role: z.enum(ROLES, {
    message: "Debe seleccionar un cargo válido.",
  }),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;


// ======================================
//   PAGE
// ======================================

export default function EmployeesPage() {
  const {
    isMounted,
    currentUser,
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  } = useAppStore();

  const router = useRouter();
  const { toast } = useToast();

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);

  const sortedEmployees = useMemo(() => {
    if (!employees) return [];
    return [...employees].sort((a, b) => b.createdAt - a.createdAt);
  }, [employees]);

  // FORM ADD
  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      role: undefined,
    },
  });

  // FORM EDIT
  const editForm = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
  });

  useEffect(() => {
    if (selectedEmployee) {
      editForm.reset({
        name: selectedEmployee.name,
        role: selectedEmployee.role as EmployeeFormData["role"],
      });
    }
  }, [selectedEmployee, editForm]);

  // ADD EMPLOYEE
  const onSubmit = async (values: EmployeeFormData) => {
    try {
      await addEmployee(values);
      toast({
        title: "Empleado añadido",
        description: `${values.name} ha sido registrado como ${values.role}.`,
      });
      form.reset({ name: "", role: undefined });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al añadir empleado",
        description: error.message || "Intente nuevamente.",
      });
    }
  };

  // EDIT EMPLOYEE
  const onEditSubmit = async (values: EmployeeFormData) => {
    if (!selectedEmployee) return;

    try {
      await updateEmployee(selectedEmployee.id, values);
      toast({
        title: "Empleado actualizado",
        description: `${values.name} ha sido modificado.`,
      });
      setEditModalOpen(false);
      setSelectedEmployee(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar.",
      });
    }
  };

  // DELETE EMPLOYEE
  const handleDelete = async () => {
    if (!selectedEmployee) return;

    try {
      await deleteEmployee(selectedEmployee.id);
      toast({
        title: "Empleado eliminado",
        description: `${selectedEmployee.name} ha sido eliminado.`,
      });
      setDeleteAlertOpen(false);
      setSelectedEmployee(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar.",
      });
    }
  };


  // REDIRECT IF NOT LOGGED
  useEffect(() => {
    if (isMounted && !currentUser) {
      router.push("/dashboard");
    }
  }, [currentUser, isMounted, router]);


  // ======================================
  //   LOADING & ACCESS CHECKS
  // ======================================

  if (!isMounted || !currentUser || !employees) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-4">Cargando...</h1>
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-4">Acceso denegado</h1>
        <p className="text-muted-foreground mb-6">
          Solo los administradores pueden gestionar empleados.
        </p>
        <Link href="/dashboard">
          <Button>Volver al Salón</Button>
        </Link>
      </div>
    );
  }


  // ======================================
  //   MAIN LAYOUT
  // ======================================

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 overflow-x-hidden">
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 border-b pb-4">
          <div className="flex items-center gap-4 min-w-0">
            <AppSidebar />
            <h1 className="text-2xl md:text-3xl font-semibold flex items-center gap-3 truncate">
              <Users className="h-7 w-7 text-teal-600" />
              Gestión de Empleados
            </h1>
          </div>

          <Link href="/admin/dashboard" className="flex items-center">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              Volver al Dashboard
            </Button>
          </Link>
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid gap-6 lg:grid-cols-5 w-full">

          {/* FORMULARIO */}
          <div className="lg:col-span-2 min-w-0 space-y-6">
            <Card className="shadow-xl w-full border border-border rounded-xl overflow-hidden">

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">

                  <CardHeader className="bg-gradient-to-r from-teal-50 to-blue-50 border-b">
                    <CardTitle className="text-lg text-teal-700">
                      Añadir Nuevo Empleado
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="py-6 space-y-4">
                    {/* NAME */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre Completo</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej. Juan Pérez"
                              {...field}
                              autoFocus
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* ROLE */}
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un cargo" />
                              </SelectTrigger>
                            </FormControl>

                            <SelectContent>
                              {ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>

                  <CardFooter className="bg-muted/40 border-t p-4">
                    <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Añadir Empleado
                    </Button>
                  </CardFooter>

                </form>
              </Form>
            </Card>
          </div>

          {/* LISTA DE EMPLEADOS */}
          <div className="lg:col-span-3 min-w-0">
            <Card className="w-full shadow-xl rounded-xl border border-border overflow-hidden">
              <CardHeader className="pb-3 border-b bg-gradient-to-r from-teal-50 to-blue-50">
                <CardTitle className="text-lg text-teal-700">Lista de Empleados</CardTitle>
              </CardHeader>

              <CardContent className="p-0 w-full">
                {/* AREA SCROLLABLE */}
                <ScrollArea className="h-[50vh] sm:h-[60vh] w-full overflow-x-auto">
                  <div className="w-full min-w-[650px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-4 whitespace-nowrap">Nombre</TableHead>
                          <TableHead className="px-4 whitespace-nowrap">Cargo</TableHead>
                          <TableHead className="px-4 whitespace-nowrap">Fecha de Ingreso</TableHead>
                          <TableHead className="px-4 whitespace-nowrap text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {sortedEmployees.length > 0 ? (
                          sortedEmployees.map((employee) => (
                            <TableRow
                              key={employee.id}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <TableCell className="font-medium px-4 whitespace-nowrap max-w-[180px] truncate">
                                {employee.name}
                              </TableCell>

                              <TableCell className="px-4 whitespace-nowrap">
                                {employee.role}
                              </TableCell>

                              <TableCell className="px-4 whitespace-nowrap">
                                {employee.createdAt === 0 ? (
                                  <span className="text-muted-foreground italic">
                                    Usuario del sistema
                                  </span>
                                ) : (
                                  format(
                                    new Date(employee.createdAt),
                                    "dd MMM yyyy",
                                    { locale: es }
                                  )
                                )}
                              </TableCell>

                              <TableCell className="px-4 text-right">
                                {employee.createdAt !== 0 && (
                                  <div className="flex justify-end gap-1 flex-wrap">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setSelectedEmployee(employee);
                                        setEditModalOpen(true);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setSelectedEmployee(employee);
                                        setDeleteAlertOpen(true);
                                      }}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="h-24 text-center text-muted-foreground"
                            >
                              No hay empleados registrados.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* =========================================
            MODAL DE EDICIÓN
        ========================================== */}
        <Dialog open={isEditModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-[425px] max-w-[90vw] rounded-xl">
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
                <DialogHeader>
                  <DialogTitle>Editar Empleado</DialogTitle>
                  <DialogDescription>
                    Actualice los datos del empleado y guarde los cambios.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  {/* NAME */}
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Juan Pérez" {...field} autoFocus />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* ROLE */}
                  <FormField
                    control={editForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un cargo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
                    Guardar Cambios
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* =========================================
            ALERTA DE ELIMINACIÓN
        ========================================== */}
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
          <AlertDialogContent className="rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar empleado?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción es permanente y eliminará al empleado del sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </main>
    </div>
  );
}
