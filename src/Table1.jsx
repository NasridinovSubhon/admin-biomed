import { useState, useEffect, useMemo } from "react";
import { adminDataStore } from './app/zustand';
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./components/ui/alert-dialog";
import { Skeleton } from "./components/ui/skeleton";

const TableComponent = () => {
  const { getZapis, postZapis, dataZapis, dataDoctors, dataCateg, getDataCategory, getDataDoctors, deleteZapis } = adminDataStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, type: "single" });
  const [timeConflict, setTimeConflict] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);

  const [newUser, setNewUser] = useState({
    fullName: "",
    service: "",
    doctor: "",
    date: "",
    time: "",
    phoneNumber: ""
  });

  useEffect(() => {
    const initializeData = async () => {
      await getDataCategory();
      await getDataDoctors();
      await getZapis();
      setIsLoading(false);
    };
    initializeData();
  }, [getZapis, getDataCategory, getDataDoctors]);

  // Функция для проверки конфликта времени
  const checkTimeConflict = (doctorId, date, time) => {
    if (!doctorId || !date || !time) return null;

    const appointmentDuration = 30; // 30 минут на прием
    const newAppointmentTime = new Date(`${date}T${time}`);
    const newAppointmentEnd = new Date(newAppointmentTime.getTime() + appointmentDuration * 60000);

    const conflicts = dataZapis.filter(record => {
      if (record.doctor.toString() !== doctorId.toString() || record.date !== date) return false;

      const existingTime = new Date(`${record.date}T${record.time}`);
      const existingEnd = new Date(existingTime.getTime() + appointmentDuration * 60000);

      // Проверка пересечения временных интервалов
      return (
        (newAppointmentTime >= existingTime && newAppointmentTime < existingEnd) ||
        (newAppointmentEnd > existingTime && newAppointmentEnd <= existingEnd) ||
        (newAppointmentTime <= existingTime && newAppointmentEnd >= existingEnd)
      );
    });

    return conflicts.length > 0 ? conflicts : null;
  };

  // Генерация доступного времени
  const generateAvailableTimes = (doctorId, date) => {
    if (!doctorId || !date) return [];

    const workingHours = { start: 8, end: 18 }; // с 8:00 до 18:00
    const appointmentDuration = 30; // 30 минут
    const availableSlots = [];

    // Получаем существующие записи врача на эту дату
    const existingAppointments = dataZapis.filter(
      record => record.doctor.toString() === doctorId.toString() && record.date === date
    );

    // Создаем сет занятых временных слотов
    const bookedSlots = new Set();
    existingAppointments.forEach(appointment => {
      const time = appointment.time;
      bookedSlots.add(time);

      // Также блокируем время за 30 минут до и после
      const timeDate = new Date(`2000-01-01T${time}`);
      const beforeTime = new Date(timeDate.getTime() - appointmentDuration * 60000);
      const afterTime = new Date(timeDate.getTime() + appointmentDuration * 60000);

      bookedSlots.add(beforeTime.toTimeString().slice(0, 5));
      bookedSlots.add(afterTime.toTimeString().slice(0, 5));
    });

    // Генерируем все возможные слоты в рабочие часы
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += appointmentDuration) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        if (!bookedSlots.has(timeString)) {
          availableSlots.push(timeString);
        }
      }
    }

    return availableSlots;
  };

  // Обработчик изменения даты или врача
  const handleDoctorOrDateChange = (field, value) => {
    setNewUser(prev => {
      const updated = { ...prev, [field]: value };

      // Если изменился врач или дата, проверяем конфликты и обновляем доступное время
      if ((field === 'doctor' || field === 'date') && updated.doctor && updated.date) {
        const conflicts = checkTimeConflict(updated.doctor, updated.date, updated.time);
        setTimeConflict(conflicts);

        const times = generateAvailableTimes(updated.doctor, updated.date);
        setAvailableTimes(times);

        // Если текущее время недоступно, сбрасываем его
        if (updated.time && !times.includes(updated.time)) {
          updated.time = "";
        }
      } else {
        // Если врач или дата сброшены, очищаем время и доступные слоты
        updated.time = "";
        setAvailableTimes([]);
        setTimeConflict(null);
      }

      return updated;
    });
  };

  // Обработчик изменения времени
  const handleTimeChange = (time) => {
    setNewUser(prev => {
      const updated = { ...prev, time };

      if (updated.doctor && updated.date && time) {
        const conflicts = checkTimeConflict(updated.doctor, updated.date, time);
        setTimeConflict(conflicts);
      } else {
        setTimeConflict(null);
      }

      return updated;
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    // Проверка конфликта перед отправкой
    if (newUser.doctor && newUser.date && newUser.time) {
      const conflicts = checkTimeConflict(newUser.doctor, newUser.date, newUser.time);
      if (conflicts) {
        setTimeConflict(conflicts);
        return;
      }
    }

    try {
      await postZapis(newUser);
      setShowAddForm(false);
      setNewUser({
        fullName: "",
        service: "",
        doctor: "",
        date: "",
        time: "",
        phoneNumber: ""
      });
      setTimeConflict(null);
      setAvailableTimes([]);
      await getZapis();
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Муайян нашудааст";
    try {
      return new Date(dateString).toLocaleDateString('ru-RU');
    } catch {
      return dateString;
    }
  };

  const getDoctorName = (doctorId) => {
    const doctor = dataDoctors.find(d => d.id === parseInt(doctorId));
    return doctor ? doctor.name : `Духтур #${doctorId}`;
  };

  // Функция для проверки, остался ли 1 час до приема
  const isOneHourLeft = (record) => {
    const now = new Date();
    const recordDateTime = new Date(`${record.date}T${record.time}`);
    const timeDiff = recordDateTime - now;
    return timeDiff > 0 && timeDiff <= 60 * 60 * 1000;
  };

  // Функция для проверки истекших записей
  const isExpired = (record) => {
    const now = new Date();
    const recordDateTime = new Date(`${record.date}T${record.time}`);
    return recordDateTime < now;
  };

  // Мемоизированные данные для таблиц
  const oneHourLeftRecords = useMemo(() =>
    dataZapis.filter(record => isOneHourLeft(record)),
    [dataZapis]
  );

  const expiredRecords = useMemo(() =>
    dataZapis.filter(record => isExpired(record)),
    [dataZapis]
  );

  const activeRecords = useMemo(() =>
    dataZapis.filter(record => !isExpired(record) && !isOneHourLeft(record)),
    [dataZapis]
  );

  // Функция для удаления всех истекших записей
  const handleDeleteAllExpired = async () => {
    if (expiredRecords.length === 0) return;
    setDeleteDialog({ open: true, id: null, type: "all" });
  };

  // Функция для удаления одной записи
  const handleDeleteRecord = async (id) => {
    setDeleteDialog({ open: true, id, type: "single" });
  };

  // Подтверждение удаления
  const confirmDelete = async () => {
    try {
      if (deleteDialog.type === "all") {
        for (const record of expiredRecords) {
          await deleteZapis(record.id);
        }
      } else {
        await deleteZapis(deleteDialog.id);
      }
      await getZapis();
    } catch (error) {
      console.error("Error deleting records:", error);
    } finally {
      setDeleteDialog({ open: false, id: null, type: "single" });
    }
  };

  // Скелетон для таблицы
  const TableSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );

  // Скелетон для заголовка
  const HeaderSkeleton = () => (
    <div className="flex justify-between items-center mb-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-10 w-40" />
    </div>
  );

  const renderTable = (records, title, description, variant = "default") => (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              {title}
              <Badge variant={
                variant === "warning" ? "secondary" :
                  variant === "destructive" ? "destructive" : "default"
              }>
                {records.length}
              </Badge>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {variant === "destructive" && records.length > 0 && (
            <Button variant="destructive" onClick={handleDeleteAllExpired}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Ҳамаро нест кунед
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Номи пурра</TableHead>
                <TableHead>Хизматрасонӣ</TableHead>
                <TableHead>Духтур</TableHead>
                <TableHead>Сана</TableHead>
                <TableHead>Вақт</TableHead>
                <TableHead>Рақам</TableHead>
                <TableHead className="w-[100px]">Амалҳо</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <TableSkeleton />
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-muted-foreground mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Қайдҳо барои намоиш нестанд
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id} className={
                    variant === "warning" ? "bg-amber-50 hover:bg-amber-100" :
                      variant === "destructive" ? "bg-red-50 hover:bg-red-100" : ""
                  }>
                    <TableCell className="font-mono text-sm">#{record.id}</TableCell>
                    <TableCell className="font-medium">{record.fullName}</TableCell>
                    <TableCell>{record.service}</TableCell>
                    <TableCell>{getDoctorName(record.doctor)}</TableCell>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell>{record.time}</TableCell>
                    <TableCell>{record.phoneNumber || "Муайян нашудааст"}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRecord(record.id)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        {isLoading ? (
          <HeaderSkeleton />
        ) : (
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Панели администратор</h1>
              <p className="text-muted-foreground mt-2">Идоракунии ҳамаи қайдҳои беморон</p>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Илова кардани қайд
            </Button>
          </div>
        )}

        {/* Таблицы */}
        {renderTable(
          oneHourLeftRecords,
          "Қайдҳои бо вақти монда",
          "Қайдҳое, ки то 1 соат вақт доранд",
          "warning"
        )}

        {renderTable(
          expiredRecords,
          "Қайдҳои ба охир расида",
          "Қайдҳое, ки вақташон ба охир расидааст",
          "destructive"
        )}

        {renderTable(
          activeRecords,
          "Қайдҳои фаъол",
          "Қайдҳои омадаи оянда",
          "default"
        )}

        {/* Модальное окно добавления новой записи */}
        <Dialog open={showAddForm} onOpenChange={(open) => {
          setShowAddForm(open);
          if (!open) {
            setTimeConflict(null);
            setAvailableTimes([]);
            setNewUser({
              fullName: "",
              service: "",
              doctor: "",
              date: "",
              time: "",
              phoneNumber: ""
            });
          }
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Илова кардани қайди нав</DialogTitle>

            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Номи пурра *</Label>
                <Input
                  id="fullName"
                  required
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  placeholder="Номи пурраи беморро ворид кунед"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Хизматрасонӣ *</Label>
                <Select
                  required
                  value={newUser.service}
                  onValueChange={(value) => setNewUser({ ...newUser, service: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Хизматрасониро интихоб кунед" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataCateg.map((category) => (
                      <SelectItem key={category.id} value={category.sohaiKlinik}>
                        {category.sohaiKlinik}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor">Духтур *</Label>
                <Select
                  required
                  value={newUser.doctor}
                  onValueChange={(value) => handleDoctorOrDateChange('doctor', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Духтурро интихоб кунед" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataDoctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        {doctor.name} - {doctor.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Сана *</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={newUser.date}
                    onChange={(e) => handleDoctorOrDateChange('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Вақт *</Label>
                  <Select
                    required
                    value={newUser.time}
                    onValueChange={handleTimeChange}
                    disabled={!newUser.doctor || !newUser.date || availableTimes.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !newUser.doctor || !newUser.date
                          ? "Аввал духтур"
                          : availableTimes.length === 0
                            ? "Вақтҳои дастрас нестанд"
                            : "Вақтро интихоб кунед"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimes.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {timeConflict && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-destructive mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-destructive">
                      <p className="font-medium">Ин вақт барои ин духтур банд аст.</p>
                      <p className="mt-1">Қайдҳои мавҷуда:</p>
                      <ul className="mt-1 list-disc list-inside">
                        {timeConflict.map((conflict, index) => (
                          <li key={index}>
                            {conflict.fullName} - {conflict.time}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Рақами телефон</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={newUser.phoneNumber}
                  onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                  placeholder="+992 XX XXX XX XX"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setShowAddForm(false);
                  setTimeConflict(null);
                  setAvailableTimes([]);
                  setNewUser({
                    fullName: "",
                    service: "",
                    doctor: "",
                    date: "",
                    time: "",
                    phoneNumber: ""
                  });
                }}>
                  Бекор кардан
                </Button>
                <Button type="submit" disabled={!!timeConflict || !newUser.time}>
                  Илова кардани қайд
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Диалог подтверждения удаления */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deleteDialog.type === "all" ? "Ҳамаи қайдҳои ба охир расидаро нест кардан?" : "Қайдро нест кардан?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteDialog.type === "all"
                  ? `Шумо боварӣ доред, ки мехоҳед ҳамаи ${expiredRecords.length} қайдҳои ба охир расидаро нест кунед? Ин амал бозгашт надорад.`
                  : "Шумо боварӣ доред, ки мехоҳед ин қайдро нест кунед? Ин амал бозгашт надорад."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Бекор кардан</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Нест кардан
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default TableComponent;

// import { useState, useEffect, useMemo } from "react";
// import { adminDataStore } from './app/zustand';
// import {
//   Search, Filter, Edit, Trash2, User, Phone, Calendar, Clock, Stethoscope, Plus, Download, Mail, CheckCircle, XCircle, MoreVertical, Eye, Send, RefreshCw
// } from "lucide-react";

// const Table = () => {
//   const { dataCateg, getDataCategory, getDataDoctors, dataDoctors, getZapis, postZapis, dataZapis } = adminDataStore();

//   const [filteredBookings, setFilteredBookings] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterStatus, setFilterStatus] = useState("all");
//   const [filterDate, setFilterDate] = useState("");
//   const [editingBooking, setEditingBooking] = useState(null);
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false);
//   const [selectedBooking, setSelectedBooking] = useState(null);
//   const [activeDropdown, setActiveDropdown] = useState(null);
//   const [bulkSelection, setBulkSelection] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isDataLoading, setIsDataLoading] = useState(true);
//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [syncStatus, setSyncStatus] = useState("success");

//   const [newBooking, setNewBooking] = useState({
//     fullName: "",
//     phoneNumber: "",
//     service: "",
//     doctor: "",
//     date: "",
//     time: "",
//     status: "pending",
//     notes: ""
//   });

//   // Загрузка данных категорий и врачей
//   useEffect(() => {
//     const loadData = async () => {
//       setIsDataLoading(true);
//       try {
//         await Promise.all([getDataCategory(), getDataDoctors()]);
//       } catch (error) {
//         console.error("Error loading data:", error);
//       } finally {
//         setIsDataLoading(false);
//       }
//     };
//     loadData();
//   }, [getDataCategory, getDataDoctors]);

//   // Статусы для фильтрации
//   const statusOptions = [
//     { value: "all", label: "Все статусы", color: "gray" },
//     { value: "pending", label: "Ожидание", color: "yellow" },
//     { value: "confirmed", label: "Подтверждено", color: "green" },
//     { value: "completed", label: "Завершено", color: "blue" },
//     { value: "cancelled", label: "Отменено", color: "red" },
//     { value: "no-show", label: "Не явился", color: "orange" }
//   ];

//   // Получение названия услуги
//   const getServiceName = (serviceKey) => {
//     if (!serviceKey) return "Не указана";

//     // Пытаемся найти в категориях
//     const service = dataCateg.find(cat =>
//       cat.sohaiKlinik?.toLowerCase() === serviceKey?.toLowerCase() ||
//       cat.id === serviceKey
//     );

//     return service ? service.sohaiKlinik : serviceKey;
//   };

//   // Получение имени врача по ID
//   const getDoctorName = (doctorId) => {
//     if (!doctorId) return "Не указан";

//     // Пробуем разные форматы ID
//     const doctor = dataDoctors.find(doc =>
//       doc.id === doctorId ||
//       doc.id == doctorId || // нестрогое сравнение для строк/чисел
//       doc.id === parseInt(doctorId)
//     );

//     return doctor ? doctor.name : `Врач #${doctorId}`;
//   };

//   // Получение изображения врача
//   const getDoctorImage = (doctorId) => {
//     if (!doctorId) return null;

//     const doctor = dataDoctors.find(doc =>
//       doc.id === doctorId ||
//       doc.id == doctorId ||
//       doc.id === parseInt(doctorId)
//     );

//     return doctor ? doctor.img : null;
//   };

//   // Форматирование записей из dataZapis
//   const formattedBookings = useMemo(() => {
//     if (!dataZapis || !Array.isArray(dataZapis)) return [];

//     console.log('Форматирование записей из dataZapis:', dataZapis.length);

//     return dataZapis.map(booking => {
//       const formatted = {
//         id: booking.id?.toString() || `temp-${Date.now()}-${Math.random()}`,
//         fullName: booking.fullName || 'Не указано',
//         phoneNumber: booking.phoneNumber || 'Не указан',
//         service: booking.service || '',
//         doctor: booking.doctor,
//         date: booking.date || '',
//         time: booking.time || '',
//         status: booking.status || 'pending',
//         notes: booking.notes || '',
//         createdAt: booking.createdAt || new Date().toISOString(),
//         updatedAt: booking.updatedAt || new Date().toISOString(),
//         doctorName: getDoctorName(booking.doctor),
//         doctorImg: getDoctorImage(booking.doctor)
//       };

//       return formatted;
//     }).sort((a, b) => {
//       // Сортируем по дате создания (новые сначала)
//       return new Date(b.createdAt) - new Date(a.createdAt);
//     });
//   }, [dataZapis, dataDoctors]);

//   // Фильтрация записей
//   useEffect(() => {
//     let filtered = formattedBookings;

//     if (searchTerm) {
//       filtered = filtered.filter(booking =>
//         booking.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         booking.phoneNumber?.includes(searchTerm) ||
//         getServiceName(booking.service)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         getDoctorName(booking.doctor)?.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }

//     if (filterStatus !== "all") {
//       filtered = filtered.filter(booking => booking.status === filterStatus);
//     }

//     if (filterDate) {
//       filtered = filtered.filter(booking => booking.date === filterDate);
//     }

//     setFilteredBookings(filtered);
//   }, [formattedBookings, searchTerm, filterStatus, filterDate, dataCateg, dataDoctors]);

//   // Обновление записи в API
//   const updateBookingInAPI = async (bookingData) => {
//     try {
//       setSyncStatus("syncing");

//       // Подготавливаем данные для API
//       const apiData = {
//         fullName: bookingData.fullName,
//         service: bookingData.service,
//         doctor: bookingData.doctor,
//         date: bookingData.date,
//         time: bookingData.time
//       };

//       // Добавляем ID если редактируем существующую запись
//       if (bookingData.id && !bookingData.id.startsWith('temp-')) {
//         apiData.id = parseInt(bookingData.id);
//       }

//       console.log("Отправка данных в API:", apiData);
//       const response = await postZapis(apiData);
//       console.log("Ответ от API:", response);

//       // После успешного обновления перезагружаем данные
//       await getZapis();
//       setSyncStatus("success");
//       return true;
//     } catch (error) {
//       console.error("Error updating booking in API:", error);
//       setSyncStatus("error");
//       return false;
//     }
//   };

//   // Удаление записи (помечаем как отмененную)
//   const handleDelete = async (id) => {
//     if (confirm("Вы уверены, что хотите удалить эту запись?")) {
//       try {
//         const bookingToDelete = formattedBookings.find(booking => booking.id === id);
//         if (bookingToDelete) {
//           const deletedBooking = {
//             ...bookingToDelete,
//             status: "cancelled"
//           };

//           const success = await updateBookingInAPI(deletedBooking);
//           if (success) {
//             console.log('Запись помечена как удаленная');
//           }
//         }
//       } catch (error) {
//         console.error("Error deleting booking:", error);
//         alert("Ошибка при удалении записи");
//       }
//     }
//   };

//   const handleBulkDelete = () => {
//     if (bulkSelection.length === 0) return;

//     if (confirm(`Пометить ${bulkSelection.length} записей как отмененные?`)) {
//       bulkSelection.forEach(async (id) => {
//         const bookingToDelete = formattedBookings.find(booking => booking.id === id);
//         if (bookingToDelete) {
//           const deletedBooking = {
//             ...bookingToDelete,
//             status: "cancelled"
//           };
//           await updateBookingInAPI(deletedBooking);
//         }
//       });
//       setBulkSelection([]);
//     }
//   };

//   const handleStatusChange = async (id, newStatus) => {
//     const bookingToUpdate = formattedBookings.find(booking => booking.id === id);
//     if (bookingToUpdate) {
//       const updatedBooking = {
//         ...bookingToUpdate,
//         status: newStatus,
//         updatedAt: new Date().toISOString()
//       };

//       const success = await updateBookingInAPI(updatedBooking);
//       if (success) {
//         setActiveDropdown(null);
//       }
//     }
//   };

//   const handleEdit = (booking) => {
//     setEditingBooking(booking);
//     setNewBooking({
//       fullName: booking.fullName,
//       phoneNumber: booking.phoneNumber,
//       service: booking.service,
//       doctor: booking.doctor,
//       date: booking.date,
//       time: booking.time,
//       status: booking.status || "pending",
//       notes: booking.notes || ""
//     });
//     setIsAddModalOpen(true);
//   };

//   const handleView = (booking) => {
//     setSelectedBooking(booking);
//     setIsViewModalOpen(true);
//   };

//   const handleAddNew = () => {
//     setEditingBooking(null);
//     setNewBooking({
//       fullName: "",
//       phoneNumber: "",
//       service: "",
//       doctor: "",
//       date: "",
//       time: "",
//       status: "pending",
//       notes: ""
//     });
//     setIsAddModalOpen(true);
//   };

//   const handleSave = async () => {
//     if (!newBooking.fullName || !newBooking.service) {
//       alert("Заполните обязательные поля (ФИО и услуга)");
//       return;
//     }

//     try {
//       const bookingData = {
//         fullName: newBooking.fullName,
//         phoneNumber: newBooking.phoneNumber,
//         service: newBooking.service,
//         doctor: newBooking.doctor,
//         date: newBooking.date,
//         time: newBooking.time,
//         status: newBooking.status,
//         notes: newBooking.notes,
//         createdAt: editingBooking ? editingBooking.createdAt : new Date().toISOString(),
//         updatedAt: new Date().toISOString()
//       };

//       if (editingBooking) {
//         // Редактирование существующей записи
//         bookingData.id = editingBooking.id;
//       }

//       console.log("Сохранение записи:", bookingData);
//       const success = await updateBookingInAPI(bookingData);

//       if (success) {
//         setIsAddModalOpen(false);
//         setEditingBooking(null);
//         setNewBooking({
//           fullName: "",
//           phoneNumber: "",
//           service: "",
//           doctor: "",
//           date: "",
//           time: "",
//           status: "pending",
//           notes: ""
//         });
//       } else {
//         alert("Ошибка при сохранении записи");
//       }
//     } catch (error) {
//       console.error("Error saving booking:", error);
//       alert("Ошибка при сохранении записи");
//     }
//   };

//   const handleBulkSelection = (id) => {
//     setBulkSelection(prev =>
//       prev.includes(id)
//         ? prev.filter(item => item !== id)
//         : [...prev, id]
//     );
//   };

//   const handleSelectAll = () => {
//     if (bulkSelection.length === filteredBookings.length) {
//       setBulkSelection([]);
//     } else {
//       setBulkSelection(filteredBookings.map(booking => booking.id));
//     }
//   };

//   const exportToCSV = () => {
//     const headers = ["ID", "Имя", "Телефон", "Услуга", "Врач", "Дата", "Время", "Статус", "Дата создания"];
//     const csvData = filteredBookings.map(booking => [
//       booking.id,
//       booking.fullName,
//       booking.phoneNumber,
//       getServiceName(booking.service),
//       getDoctorName(booking.doctor),
//       booking.date,
//       booking.time,
//       booking.status || "pending",
//       new Date(booking.createdAt).toLocaleDateString('ru-RU')
//     ]);

//     const csvContent = [
//       headers.join(','),
//       ...csvData.map(row => row.map(field => `"${field}"`).join(','))
//     ].join('\n');

//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const link = document.createElement('a');
//     const url = URL.createObjectURL(blob);
//     link.setAttribute('href', url);
//     link.setAttribute('download', `bookings_${new Date().toISOString().split('T')[0]}.csv`);
//     link.style.visibility = 'hidden';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   const sendReminder = (booking) => {
//     alert(`Напоминание отправлено ${booking.fullName} на ${booking.phoneNumber}`);
//     setActiveDropdown(null);
//   };

//   const refreshData = () => {
//     setIsRefreshing(true);
//     getZapis().finally(() => setIsRefreshing(false));
//   };

//   const getStatusColor = (status) => {
//     const statusMap = {
//       pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
//       confirmed: "bg-green-100 text-green-800 border-green-200",
//       completed: "bg-blue-100 text-blue-800 border-blue-200",
//       cancelled: "bg-red-100 text-red-800 border-red-200",
//       "no-show": "bg-orange-100 text-orange-800 border-orange-200"
//     };
//     return statusMap[status] || "bg-gray-100 text-gray-800 border-gray-200";
//   };

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case 'confirmed': return <CheckCircle className="w-4 h-4" />;
//       case 'cancelled': return <XCircle className="w-4 h-4" />;
//       default: return <Clock className="w-4 h-4" />;
//     }
//   };

//   const getSyncStatusColor = () => {
//     switch (syncStatus) {
//       case "success": return "text-green-600 bg-green-100 border-green-200";
//       case "error": return "text-red-600 bg-red-100 border-red-200";
//       case "syncing": return "text-blue-600 bg-blue-100 border-blue-200";
//       default: return "text-gray-600 bg-gray-100 border-gray-200";
//     }
//   };

//   const getSyncStatusText = () => {
//     switch (syncStatus) {
//       case "success": return "Данные синхронизированы";
//       case "error": return "Ошибка синхронизации";
//       case "syncing": return "Синхронизация...";
//       default: return "Не синхронизировано";
//     }
//   };

//   // Функция для расчета времени до приема
//   const getTimeUntilAppointment = (booking) => {
//     if (!booking.date || !booking.time) return { text: "Нет времени", color: "gray" };

//     try {
//       // Пытаемся разобрать время (может быть в разных форматах)
//       let timeToParse = booking.time;

//       // Если время содержит странный формат, пытаемся извлечь нормальное время
//       if (timeToParse.includes(':')) {
//         const timeMatch = timeToParse.match(/(\d{1,2}:\d{2})/);
//         if (timeMatch) {
//           timeToParse = timeMatch[1];
//         }
//       }

//       const appointmentDate = new Date(`${booking.date}T${timeToParse}`);
//       const now = new Date();

//       if (isNaN(appointmentDate.getTime())) {
//         return { text: "Неверный формат", color: "gray" };
//       }

//       if (appointmentDate < now) {
//         return { text: "Прошедшая запись", color: "red" };
//       }

//       const diffMs = appointmentDate - now;
//       const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
//       const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
//       const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

//       let text = "";
//       if (diffDays > 0) {
//         text = `${diffDays}д ${diffHours}ч`;
//       } else if (diffHours > 0) {
//         text = `${diffHours}ч ${diffMinutes}м`;
//       } else {
//         text = `${diffMinutes}м`;
//       }

//       let color = "green";
//       if (diffDays === 0) {
//         if (diffHours < 1) {
//           color = "red";
//         } else if (diffHours < 24) {
//           color = "yellow";
//         }
//       } else if (diffDays === 1) {
//         color = "yellow";
//       }

//       return { text, color };
//     } catch (error) {
//       return { text: "Ошибка времени", color: "gray" };
//     }
//   };

//   const getTimeColorClasses = (color) => {
//     const colorMap = {
//       green: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
//       yellow: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
//       red: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
//       gray: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"
//     };
//     return colorMap[color] || colorMap.gray;
//   };

//   // Статистика
//   const stats = useMemo(() => {
//     const total = formattedBookings.length;
//     const pending = formattedBookings.filter(b => (b.status || 'pending') === 'pending').length;
//     const confirmed = formattedBookings.filter(b => b.status === 'confirmed').length;
//     const today = new Date().toISOString().split('T')[0];
//     const todayBookings = formattedBookings.filter(b => b.date === today).length;

//     return { total, pending, confirmed, todayBookings };
//   }, [formattedBookings]);

//   if (isDataLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
//         <div className="max-w-7xl mx-auto">
//           <div className="animate-pulse">
//             <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//               {[1, 2, 3, 4].map(i => (
//                 <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
//                   <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
//                   <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
//                 </div>
//               ))}
//             </div>
//             <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//               <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
//               {[1, 2, 3, 4, 5].map(i => (
//                 <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
//       <div className="max-w-7xl mx-auto">

//         {/* Заголовок с статусом синхронизации */}
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
//           <div>
//             <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
//               Управление записями
//             </h1>
//             <p className="text-gray-600 dark:text-gray-400 mt-2">
//               Всего записей: {formattedBookings.length} | Врачей: {dataDoctors.length} | Услуг: {dataCateg.length}
//             </p>
//           </div>
//           <div className="flex flex-wrap items-center gap-3">
//             {/* Статус синхронизации */}
//             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${getSyncStatusColor()}`}>
//               <div className={`w-2 h-2 rounded-full ${syncStatus === "success" ? "bg-green-500" :
//                   syncStatus === "error" ? "bg-red-500" :
//                     syncStatus === "syncing" ? "bg-blue-500 animate-pulse" : "bg-gray-500"
//                 }`}></div>
//               {getSyncStatusText()}
//             </div>

//             <button
//               onClick={refreshData}
//               disabled={isRefreshing}
//               className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
//             >
//               <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
//               Обновить
//             </button>

//             <button
//               onClick={exportToCSV}
//               className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
//             >
//               <Download className="w-4 h-4" />
//               Экспорт CSV
//             </button>

//             <button
//               onClick={handleAddNew}
//               className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
//             >
//               <Plus className="w-4 h-4" />
//               Новая запись
//             </button>
//           </div>
//         </div>

//         {/* Статистика */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Всего записей</p>
//                 <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
//               </div>
//               <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
//                 <Calendar className="w-6 h-6 text-blue-600" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-600 dark:text-gray-400">На сегодня</p>
//                 <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.todayBookings}</p>
//               </div>
//               <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
//                 <Clock className="w-6 h-6 text-green-600" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ожидают</p>
//                 <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.pending}</p>
//               </div>
//               <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
//                 <Clock className="w-6 h-6 text-yellow-600" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Подтверждено</p>
//                 <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.confirmed}</p>
//               </div>
//               <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
//                 <CheckCircle className="w-6 h-6 text-purple-600" />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Фильтры и поиск */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
//           <div className="flex flex-col lg:flex-row gap-4">
//             <div className="flex-1 relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//               <input
//                 type="text"
//                 placeholder="Поиск по имени, телефону, услуге..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
//               />
//             </div>

//             <div className="flex flex-col sm:flex-row gap-4">
//               <select
//                 value={filterStatus}
//                 onChange={(e) => setFilterStatus(e.target.value)}
//                 className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
//               >
//                 {statusOptions.map(option => (
//                   <option key={option.value} value={option.value}>
//                     {option.label}
//                   </option>
//                 ))}
//               </select>

//               <input
//                 type="date"
//                 value={filterDate}
//                 onChange={(e) => setFilterDate(e.target.value)}
//                 className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
//               />
//             </div>
//           </div>

//           {bulkSelection.length > 0 && (
//             <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
//               <span className="text-sm text-blue-700 dark:text-blue-300">
//                 Выбрано записей: {bulkSelection.length}
//               </span>
//               <div className="flex gap-2">
//                 <button
//                   onClick={handleBulkDelete}
//                   className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
//                 >
//                   <Trash2 className="w-4 h-4" />
//                   Пометить отмененными
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Таблица */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gray-50 dark:bg-gray-700/50">
//                 <tr>
//                   <th className="w-12 px-6 py-4">
//                     <input
//                       type="checkbox"
//                       checked={bulkSelection.length === filteredBookings.length && filteredBookings.length > 0}
//                       onChange={handleSelectAll}
//                       className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
//                     />
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     Пациент
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     Услуга
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     Дата и время
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     Время до приема
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     Статус
//                   </th>
//                   <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     Врач
//                   </th>
//                   <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
//                     Действия
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
//                 {filteredBookings.length === 0 ? (
//                   <tr>
//                     <td colSpan="8" className="px-6 py-12 text-center">
//                       <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
//                         <Calendar className="w-12 h-12 mb-4 opacity-50" />
//                         <p className="text-lg font-medium mb-2">Записи не найдены</p>
//                         <p className="text-sm">Попробуйте изменить параметры поиска или фильтрации</p>
//                       </div>
//                     </td>
//                   </tr>
//                 ) : (
//                   filteredBookings.map((booking) => {
//                     const timeInfo = getTimeUntilAppointment(booking);
//                     const doctorImage = getDoctorImage(booking.doctor);
//                     const doctorName = getDoctorName(booking.doctor);

//                     return (
//                       <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
//                         <td className="px-6 py-4">
//                           <input
//                             type="checkbox"
//                             checked={bulkSelection.includes(booking.id)}
//                             onChange={() => handleBulkSelection(booking.id)}
//                             className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
//                           />
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="flex items-center">
//                             <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm mr-3">
//                               {booking.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || '??'}
//                             </div>
//                             <div>
//                               <div className="font-medium text-gray-900 dark:text-white">
//                                 {booking.fullName || 'Не указано'}
//                               </div>
//                               <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
//                                 <Phone className="w-3 h-3" />
//                                 {booking.phoneNumber || 'Не указан'}
//                               </div>
//                             </div>
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="text-sm text-gray-900 dark:text-white font-medium">
//                             {getServiceName(booking.service)}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="text-sm text-gray-900 dark:text-white">
//                             {booking.date ? new Date(booking.date).toLocaleDateString('ru-RU') : 'Не указана'}
//                           </div>
//                           <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
//                             <Clock className="w-3 h-3" />
//                             {booking.time || 'Не указано'}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <button
//                             className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${getTimeColorClasses(timeInfo.color)}`}
//                             title={`Время до приема: ${timeInfo.text}`}
//                           >
//                             <Clock className="w-3 h-3" />
//                             {timeInfo.text}
//                           </button>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="relative">
//                             <button
//                               onClick={() => setActiveDropdown(activeDropdown === booking.id ? null : booking.id)}
//                               className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${getStatusColor(booking.status || 'pending')} hover:opacity-80`}
//                             >
//                               {getStatusIcon(booking.status || 'pending')}
//                               {statusOptions.find(s => s.value === (booking.status || 'pending'))?.label}
//                             </button>

//                             {activeDropdown === booking.id && (
//                               <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-10 py-1">
//                                 {statusOptions.filter(s => s.value !== 'all').map(option => (
//                                   <button
//                                     key={option.value}
//                                     onClick={() => handleStatusChange(booking.id, option.value)}
//                                     className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
//                                   >
//                                     <div className={`w-2 h-2 rounded-full bg-${option.color}-500`}></div>
//                                     {option.label}
//                                   </button>
//                                 ))}
//                               </div>
//                             )}
//                           </div>
//                         </td>
//                         <td className="px-6 py-4">
//                           <div className="flex items-center gap-2">
//                             {doctorImage ? (
//                               <img
//                                 src={doctorImage}
//                                 alt={doctorName}
//                                 className="w-8 h-8 rounded-full object-cover"
//                                 onError={(e) => {
//                                   e.target.style.display = 'none';
//                                   e.target.nextSibling.style.display = 'flex';
//                                 }}
//                               />
//                             ) : null}
//                             <div className={`w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center ${doctorImage ? 'hidden' : 'flex'}`}>
//                               <User className="w-4 h-4 text-gray-500" />
//                             </div>
//                             <span className="text-sm text-gray-900 dark:text-white">
//                               {doctorName}
//                             </span>
//                           </div>
//                         </td>
//                         <td className="px-6 py-4 text-right">
//                           <div className="flex items-center justify-end gap-2">
//                             <button
//                               onClick={() => handleView(booking)}
//                               className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
//                               title="Просмотр"
//                             >
//                               <Eye className="w-4 h-4" />
//                             </button>

//                             <button
//                               onClick={() => sendReminder(booking)}
//                               className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
//                               title="Отправить напоминание"
//                             >
//                               <Send className="w-4 h-4" />
//                             </button>

//                             <button
//                               onClick={() => handleEdit(booking)}
//                               className="p-2 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
//                               title="Редактировать"
//                             >
//                               <Edit className="w-4 h-4" />
//                             </button>

//                             <button
//                               onClick={() => handleDelete(booking.id)}
//                               className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
//                               title="Удалить"
//                             >
//                               <Trash2 className="w-4 h-4" />
//                             </button>
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Отладочная информация */}
//         {process.env.NODE_ENV === 'development' && (
//           <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
//             <p className="text-sm text-yellow-800 dark:text-yellow-200">
//               <strong>Отладка API:</strong> Загружено {formattedBookings.length} записей из dataZapis, отфильтровано {filteredBookings.length}
//             </p>
//             <button
//               onClick={() => console.log('Все записи из dataZapis:', dataZapis)}
//               className="mt-2 px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-xs"
//             >
//               Логировать dataZapis
//             </button>
//           </div>
//         )}

//         {/* Модальные окна (остаются без изменений) */}
//         {isViewModalOpen && selectedBooking && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//             {/* ... остальной код модального окна без изменений ... */}
//           </div>
//         )}

//         {isAddModalOpen && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//             {/* ... остальной код модального окна без изменений ... */}
//           </div>
//         )}
//       </div>

//       {activeDropdown && (
//         <div
//           className="fixed inset-0 z-10"
//           onClick={() => setActiveDropdown(null)}
//         />
//       )}
//     </div>
//   );
// };

// export default Table;
