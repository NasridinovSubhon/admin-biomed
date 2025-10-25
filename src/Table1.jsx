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
import { Plus, Trash2, Clock, AlertTriangle, CheckCircle, User, Calendar, Phone, CircleCheckBig } from "lucide-react";
import { toast } from "sonner";

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
      <Label htmlFor="phone-otp" className="text-sm font-medium text-foreground/80">
        Рақами телефон *
      </Label>
      <div className="flex flex-col space-y-3">
        <InputOTP
          maxLength={9}
          value={value}
          onChange={onChange}
          type="number"
          className={" bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"}
        >
          <InputOTPGroup className="flex gap-2">
            {[...Array(9)].map((_, index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className="w-10 h-10 border border-border/50 bg-background/50 backdrop-blur-sm rounded-lg transition-all duration-200 hover:border-border focus-within:ring-2 focus-within:ring-primary/20"
              />
            ))}
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


  const generateAvailableTimes = (doctorId, date) => {
    if (!doctorId || !date) return [];

    const workingHours = { start: 8, end: 18 }; // 8:00 то 18:00
    const appointmentDuration = 30; // 30 дақиқа
    const availableSlots = [];

    const today = new Date();
    const selectedDate = new Date(date);
    const isToday = selectedDate.toDateString() === today.toDateString();

    // Ҳамаи қайдҳои духтур дар санаи интихобшуда
    const existingAppointments = dataZapis.filter(
      record => record.doctor.toString() === doctorId.toString() && record.date === date
    );

    // Занятые слотҳо
    const bookedSlots = new Set();
    existingAppointments.forEach(appointment => {
      const time = appointment.time;
      bookedSlots.add(time);

      const timeDate = new Date(`2000-01-01T${time}`);
      const beforeTime = new Date(timeDate.getTime() - appointmentDuration * 60000);
      const afterTime = new Date(timeDate.getTime() + appointmentDuration * 60000);

      bookedSlots.add(beforeTime.toTimeString().slice(0, 5));
      bookedSlots.add(afterTime.toTimeString().slice(0, 5));
    });

    // Генерация всех возможных слотов
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += appointmentDuration) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // Агар ин рӯзи имрӯз бошад — вақт набояд аз "ҳоло + 30 дақиқа" барвақт бошад
        if (isToday) {
          const nowPlus30 = new Date(today.getTime() + appointmentDuration * 60000);
          const currentSlot = new Date(`2000-01-01T${timeString}`);
          const nowSlot = new Date(`2000-01-01T${nowPlus30.toTimeString().slice(0, 5)}`);
          if (currentSlot < nowSlot) continue; // Пропускаем слишком ранние
        }

        // Агар вақт холӣ бошад
        if (!bookedSlots.has(timeString)) {
          availableSlots.push({
            time: timeString,
            status: "free"
          });
        } else {
          availableSlots.push({
            time: timeString,
            status: "busy"
          });
        }
      }
    }

    // Филтр мекунем, то танҳо "озод"-ҳоро нишон диҳем
    return availableSlots.filter(slot => slot.status === "free").map(slot => slot.time);
  };


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


    toast.promise(
      async () => {
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
      },
      {
        loading: (
          <div className="flex items-center gap-2">
            Илова кардани қайд...
          </div>
        ),
        success: (
          <div className="flex items-center gap-2">
            Қайд бомуваффақият илова шуд!
          </div>
        ),
        error: (
          <div className="flex items-center gap-2">
            <CircleCheckBig className="h-4 w-4 text-red-500" />
            Хатоги дар илова кардани қайд
          </div>
        )
      }
    );
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
        toast.promise(
          async () => {
            for (const record of expiredRecords) {
              await deleteZapis(record.id);
            }
            await getZapis();
          },
          {
            loading: (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Қайдҳо нест карда мешаванд...
              </div>
            ),
            success: (
              <div className="flex items-center gap-2">
                <CircleCheckBig className="h-4 w-4 text-green-500" />
                Қайдҳо бомуваффақият нест шуданд!
              </div>
            ),
            error: (
              <div className="flex items-center gap-2">
                <CircleCheckBig className="h-4 w-4 text-red-500" />
                Хатоги дар нест кардани қайдҳо
              </div>
            )
          }
        );
      } else {
        toast.promise(
          async () => {
            await deleteZapis(deleteDialog.id);
            await getZapis();
          },
          {
            loading: (
              <div className="flex items-center gap-2">
                Қайд нест карда мешавад...
              </div>
            ),
            success: (
              <div className="flex items-center gap-2">

                Қайд бомуваффақият нест шуд!
              </div>
            ),
            error: (
              <div className="flex items-center gap-2">
                <CircleCheckBig className="h-4 w-4 text-red-500" />
                Хатоги дар нест кардани қайд
              </div>
            )
          }
        );
      }
    } catch (error) {
      console.error("Error deleting records:", error);
    } finally {
      setDeleteDialog({ open: false, id: null, type: "single" });
    }
  };

  // Скелетон для таблицы
  const TableSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
          <Skeleton className="h-4 w-16 rounded-lg" />
          <Skeleton className="h-4 flex-1 rounded-lg" />
          <Skeleton className="h-4 flex-1 rounded-lg" />
          <Skeleton className="h-4 flex-1 rounded-lg" />
          <Skeleton className="h-4 w-20 rounded-lg" />
          <Skeleton className="h-4 w-16 rounded-lg" />
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );

  // Скелетон для заголовка
  const HeaderSkeleton = () => (
    <div className="flex justify-between items-center mb-8">
      <div className="space-y-3">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-4 w-48 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-40 rounded-xl" />
    </div>
  );

  const renderTable = (records, title, description, variant = "default", icon) => {
    const variantStyles = {
      warning: {
        card: "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30",
        badge: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300/50",
        icon: <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      },
      destructive: {
        card: "bg-red-50/50 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/30",
        badge: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-300/50",
        icon: <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
      },
      default: {
        card: "bg-background/50 backdrop-blur-sm border-border/50",
        badge: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300/50",
        icon: <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      }
    };

    const styles = variantStyles[variant] || variantStyles.default;

    return (
      <Card className={`mb-6 transition-all duration-300 hover:shadow-lg ${styles.card} border backdrop-blur-sm`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50">
                {icon || styles.icon}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  {title}
                  <Badge variant="outline" className={`${styles.badge} border`}>
                    {records.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-sm">{description}</CardDescription>
              </div>
            </div>
            {variant === "destructive" && records.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleDeleteAllExpired}
                className="rounded-xl bg-red-500/90 hover:bg-red-600 backdrop-blur-sm border border-red-300/50 dark:border-red-700/50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Ҳамаро нест кунед
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/50 overflow-hidden backdrop-blur-sm">
            <Table>
              <TableHeader className="bg-background/50 backdrop-blur-sm">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="w-[80px] font-medium text-foreground/80">ID</TableHead>
                  <TableHead className="font-medium text-foreground/80">Номи пурра</TableHead>
                  <TableHead className="font-medium text-foreground/80">Хизматрасонӣ</TableHead>
                  <TableHead className="font-medium text-foreground/80">Духтур</TableHead>
                  <TableHead className="font-medium text-foreground/80">Сана</TableHead>
                  <TableHead className="font-medium text-foreground/80">Вақт</TableHead>
                  <TableHead className="font-medium text-foreground/80">Рақам</TableHead>
                  <TableHead className="w-[100px] font-medium text-foreground/80">Амалҳо</TableHead>
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
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <div className="p-3 rounded-2xl bg-muted/50 mb-3 backdrop-blur-sm">
                          <User className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-medium mb-1">Қайдҳо барои намоиш нестанд</p>
                        <p className="text-sm text-muted-foreground">Ягон қайд пайдо нашуд</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow
                      key={record.id}
                      className={`border-border/30 transition-all duration-200 hover:bg-background/50 ${variant === "warning" ? "bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50/50 dark:hover:bg-amber-950/20" :
                        variant === "destructive" ? "bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50/50 dark:hover:bg-red-950/20" :
                          "hover:bg-background/30"
                        }`}
                    >
                      <TableCell className="font-mono text-sm font-medium text-foreground/80">
                        #{record.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {record.fullName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-lg bg-primary/10 text-primary border-primary/20">
                          {record.service}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          {getDoctorName(record.doctor)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(record.date)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <Badge variant="outline" className="rounded-lg border-border/50 bg-background/50">
                          {record.time}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {record.phoneNumber || "Муайян нашудааст"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteRecord(record.id)}
                          className="rounded-lg bg-red-500/90 hover:bg-red-600 backdrop-blur-sm border border-red-300/50 dark:border-red-700/50 transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
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
  };

  return (
    <div className="min-h-screen  from-background  to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {isLoading ? (
          <HeaderSkeleton />
        ) : (
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Панели администратор
              </h1>

              <p className="text-muted-foreground mt-3 text-lg">Идоракунии ҳамаи қайдҳои беморон</p>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="rounded-xl bg-primary/90 hover:bg-primary backdrop-blur-sm border border-primary/20 shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              Илова кардани қайд
            </Button>
          </div>
        )}

        {/* Демо кнопка для тестирования Promise toaster */}
        <Button
          variant="outline"
          onClick={() => {
            toast.promise(
              () =>
                new Promise((resolve) =>
                  setTimeout(() => resolve({ name: "Event" }), 2000)
                ),
              {
                loading: (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Loading...
                  </div>
                ),
                success: (data) => (
                  <div className="flex items-center gap-2">
                    <CircleCheckBig className="h-4 w-4 text-green-500" />
                    {data.name} has been created
                  </div>
                ),
                error: (
                  <div className="flex items-center gap-2">
                    <CircleCheckBig className="h-4 w-4 text-red-500" />
                    Error
                  </div>
                ),
              }
            )
          }}
          className="hidden" // Скрыта, но оставлена для демонстрации
        >
          Promise Demo
        </Button>

        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-background/50 backdrop-blur-sm border-border/50 rounded-2xl transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Қайдҳои фаъол</p>

                    <p className="text-3xl font-bold mt-2">{activeRecords.length}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/50 backdrop-blur-sm border-border/50 rounded-2xl transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Қайдҳои наздик</p>
                    <p className="text-3xl font-bold mt-2">{oneHourLeftRecords.length}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/50 backdrop-blur-sm border-border/50 rounded-2xl transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Қайдҳои ба охир расида</p>
                    <p className="text-3xl font-bold mt-2">{expiredRecords.length}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-500/10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Таблицы */}
        {renderTable(
          oneHourLeftRecords,
          "Қайдҳои бо вақти монда",
          "Қайдҳое, ки то 1 соат вақт доранд",
          "warning",
          <Clock className="h-5 w-5 text-amber-600" />
        )}

        {renderTable(
          expiredRecords,
          "Қайдҳои ба охир расида",
          "Қайдҳое, ки вақташон ба охир расидааст",
          "destructive",
          <AlertTriangle className="h-5 w-5 text-red-600" />
        )}

        {renderTable(
          activeRecords,
          "Қайдҳои фаъол",
          "Қайдҳои омадаи оянда",
          "default",
          <CheckCircle className="h-5 w-5 text-blue-600" />
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
          <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-border/50 rounded-2xl">
            <DialogHeader className="border-b border-border/30 pb-4">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Илова кардани қайди нав
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-6 py-2">
              <div className="space-y-3">
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground/80">
                  Номи пурра *
                </Label>
                <Input
                  id="fullName"
                  required
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  placeholder="Номи пурраи беморро ворид кунед"
                  className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="service" className="text-sm font-medium text-foreground/80">
                  Хизматрасонӣ *
                </Label>
                <Select
                  required
                  value={newUser.service}
                  onValueChange={handleServiceChange}
                >
                  <SelectTrigger className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Хизматрасониро интихоб кунед" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-background/95 backdrop-blur-xl border-border/50">
                    {dataCateg.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.sohaiKlinik}
                        className="rounded-lg focus:bg-primary/10 transition-colors"
                      >
                        {category.sohaiKlinik}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="doctor" className="text-sm font-medium text-foreground/80">
                  Духтур *
                </Label>
                <Select
                  required
                  value={newUser.doctor}
                  onValueChange={(value) => handleDoctorOrDateChange('doctor', value)}
                  disabled={!newUser.service || filteredDoctors.length === 0}
                >
                  <SelectTrigger className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder={
                      !newUser.service
                        ? "Аввал хизматрасониро интихоб кунед"
                        : filteredDoctors.length === 0
                          ? "Барои ин хизмат духтур нест"
                          : "Духтурро интихоб кунед"
                    } />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl bg-background/95 backdrop-blur-xl border-border/50">
                    {filteredDoctors.map((doctor) => (
                      <SelectItem
                        key={doctor.id}
                        value={doctor.id.toString()}
                        className="rounded-lg focus:bg-primary/10 transition-colors"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{doctor.name}</span>

                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newUser.service && filteredDoctors.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Барои ин хизматрасонӣ духтурҳо дастрас нестанд
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="date" className="text-sm font-medium text-foreground/80">
                    Сана *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={newUser.date}
                    onChange={(e) => handleDoctorOrDateChange('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    disabled={!newUser.doctor}
                    className="rounded-xl   bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="time" className="text-sm font-medium text-foreground/80">
                    Вақт *
                  </Label>
                  <Select
                    required
                    value={newUser.time}
                    onValueChange={handleTimeChange}
                    disabled={!newUser.doctor || !newUser.date || availableTimes.length === 0}
                  >
                    <SelectTrigger className="rounded-xl  bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20">
                      <SelectValue placeholder={
                        !newUser.doctor || !newUser.date
                          ? "Аввал духтур "
                          : availableTimes.length === 0
                            ? "Вақтҳои дастрас нестанд"
                            : "Вақтро интихоб кунед"
                      } />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl bg-background/95 backdrop-blur-xl border-border/50">
                      {availableTimes.map((time) => (
                        <SelectItem
                          key={time}
                          value={time}
                          className="rounded-lg focus:bg-primary/10 transition-colors"
                        >
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {timeConflict && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-destructive">
                      <p className="font-medium">Ин вақт барои ин духтур банд аст.</p>
                      <p className="mt-2">Қайдҳои мавҷуда:</p>
                      <ul className="mt-2 space-y-1">
                        {timeConflict.map((conflict, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-destructive"></span>
                            {conflict.fullName} - {conflict.time}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* OTP для номера телефона */}
              <PhoneNumberOTP
                value={newUser.phoneNumber}
                onChange={handlePhoneNumberChange}
              />

              <div className="flex justify-end space-x-3 pt-4 border-t border-border/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
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
                  }}
                  className="rounded-xl border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-200"
                >
                  Бекор кардан
                </Button>
                <Button
                  type="submit"
                  disabled={!!timeConflict || !newUser.time || !newUser.phoneNumber || newUser.phoneNumber.length < 9}
                  className="rounded-xl bg-primary/90 hover:bg-primary backdrop-blur-sm border border-primary/20 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Илова кардани қайд
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Диалог подтверждения удаления */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-border/50 rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-lg">
                <Trash2 className="h-5 w-5 text-destructive" />
                {deleteDialog.type === "all" ? "Ҳамаи қайдҳои ба охир расидаро нест кардан?" : "Қайдро нест кардан?"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                {deleteDialog.type === "all"
                  ? `Шумо боварӣ доред, ки мехоҳед ҳамаи ${expiredRecords.length} қайдҳои ба охир расидаро нест кунед? Ин амал бозгашт надорад.`
                  : "Шумо боварӣ доред, ки мехоҳед ин қайдро нест кунед? Ин амал бозгашт надорад."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-200">
                Бекор кардан
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="rounded-xl bg-destructive/90 hover:bg-destructive backdrop-blur-sm border border-destructive/20 shadow-lg transition-all duration-200"
              >
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
