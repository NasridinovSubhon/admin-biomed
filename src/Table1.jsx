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
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./components/ui/input-otp";

// Функция для преобразования названия специализации в ключ
const getSpecialtyKey = (categoryName) => {
  if (!categoryName) return '';

  if (['vascular', 'general', 'coloproctology', 'phlebology', 'gynecology', 'doppler', 'ultrasound'].includes(categoryName)) {
    return categoryName;
  }

  const mapping = {
    "Сосудистая хирургия": "vascular",
    "Общая хирургия": "general",
    "Колопроктология": "coloproctology",
    "Флебология": "phlebology",
    "Гинекология": "gynecology",
    "Доплерография": "doppler",
    "УЗИ-диагностика": "ultrasound"
  };

  return mapping[categoryName] || categoryName.toLowerCase();
};

// Компонент OTP для номера телефона
function PhoneNumberOTP({ value, onChange, className }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="phone-otp">Рақами телефон *</Label>
      <div className="flex flex-col space-y-3">
        <InputOTP
          maxLength={9}
          value={value}
          onChange={onChange}
        >
          <InputOTPGroup className="flex gap-1">
            <InputOTPSlot index={0} className="w-8" />
            <InputOTPSlot index={1} className="w-8" />
            <InputOTPSlot index={2} className="w-8" />
            <InputOTPSlot index={3} className="w-8" />
            <InputOTPSlot index={4} className="w-8" />
            <InputOTPSlot index={5} className="w-8" />
            <InputOTPSlot index={6} className="w-8" />
            <InputOTPSlot index={7} className="w-8" />
            <InputOTPSlot index={8} className="w-8" />
          </InputOTPGroup>
        </InputOTP>
        <div className="text-center text-sm text-muted-foreground">
          {!value ? (
            <>Введите 9 цифр номера телефона</>
          ) : value.length < 9 ? (
            <>Введено {value.length} из 9 цифр</>
          ) : (
            <>Номер: {value}</>
          )}
        </div>
      </div>
    </div>
  );
}

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

  // ФИЛЬТРАЦИЯ ВРАЧЕЙ ПО ВЫБРАННОЙ УСЛУГЕ
  const filteredDoctors = useMemo(() => {
    if (!newUser.service) return dataDoctors;

    return dataDoctors.filter(doctor => {
      const doctorSpecialtyKey = getSpecialtyKey(doctor.specialty);
      const serviceKey = getSpecialtyKey(newUser.service);
      return doctorSpecialtyKey === serviceKey;
    });
  }, [dataDoctors, newUser.service]);

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

  // Обработчик изменения услуги - сбрасываем врача и время
  const handleServiceChange = (value) => {
    setNewUser(prev => ({
      ...prev,
      service: value,
      doctor: "",
      time: ""
    }));
    setAvailableTimes([]);
    setTimeConflict(null);
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

  // Обработчик изменения номера телефона через OTP
  const handlePhoneNumberChange = (phoneNumber) => {
    setNewUser(prev => ({
      ...prev,
      phoneNumber
    }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    // Проверка валидности номера телефона
    if (!newUser.phoneNumber || newUser.phoneNumber.length < 9) {
      alert("Пожалуйста, введите корректный номер телефона (9 цифр)");
      return;
    }

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
                  onValueChange={handleServiceChange}
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
                  disabled={!newUser.service || filteredDoctors.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !newUser.service
                        ? "Аввал хизматрасониро интихоб кунед"
                        : filteredDoctors.length === 0
                          ? "Барои ин хизмат духтур нест"
                          : "Духтурро интихоб кунед"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDoctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        {doctor.name} - {doctor.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newUser.service && filteredDoctors.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Барои ин хизматрасонӣ духтурҳо дастрас нестанд
                  </p>
                )}
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
                    disabled={!newUser.doctor}
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
                          ? "Аввал духтур "
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

              {/* ЗАМЕНА ОБЫЧНОГО INPUT НА OTP ДЛЯ НОМЕРА ТЕЛЕФОНА */}
              <PhoneNumberOTP
                value={newUser.phoneNumber}
                onChange={handlePhoneNumberChange}
              />

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
                <Button
                  type="submit"
                  disabled={!!timeConflict || !newUser.time || !newUser.phoneNumber || newUser.phoneNumber.length < 9}
                >
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

