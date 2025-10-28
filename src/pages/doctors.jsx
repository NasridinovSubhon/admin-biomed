import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { adminDataStore } from '@/app/zustand';
import { Star, Plus, Edit, Trash2, X, Upload, Calendar, BriefcaseMedical } from 'lucide-react';
import { toast } from "sonner";

// Дни недели для расписания
const weekDays = {
  "1": "Понедельник",
  "2": "Вторник",
  "3": "Среда",
  "4": "Четверг",
  "5": "Пятница",
  "6": "Суббота"
};

// Медицинские изображения по умолчанию для врачей
const defaultDoctorImages = [
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1591604021695-0c69b7c05981?w=400&h=400&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=400&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop&crop=face"
];

const Doctors = () => {
  const {
    getDataDoctors,
    dataDoctors,
    postDoctor,
    updateDoctor,
    deleteDoctor,
    getDataCategory,
    dataCateg
  } = adminDataStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: "" });
  const [editingDoctor, setEditingDoctor] = useState(null);

  const [newDoctor, setNewDoctor] = useState({
    name: "",
    img: defaultDoctorImages[0],
    specialty: "",
    qualifications: "",
    education: "",
    professional_activity: "",
    experience: 0,
    rating: 0,
    reviews: 0,
    schedule: {
      "1": { start: 9, end: 18 },
      "2": { start: 9, end: 18 },
      "3": { start: 9, end: 18 },
      "4": { start: 9, end: 18 },
      "5": { start: 9, end: 17 },
      "6": { start: 10, end: 15 }
    }
  });

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([getDataDoctors(), getDataCategory()]);
      setIsLoading(false);
    };
    loadData();
  }, [getDataDoctors, getDataCategory]);

  // Функция для исправления опечатки в названии услуги
  const getCorrectedServiceName = (serviceName) => {
    if (serviceName === "УЗИ-диагностикаa") {
      return "УЗИ-диагностика";
    }
    return serviceName;
  };

  // Функция для получения списка специализаций из категорий (только sohaiKlinik)
  const getSpecialtiesFromCategories = () => {
    if (!dataCateg || dataCateg.length === 0) return [];

    // Создаем Set для удаления дубликатов
    const uniqueSpecialties = new Set();

    dataCateg.forEach(category => {
      if (category.sohaiKlinik) {
        uniqueSpecialties.add(category.sohaiKlinik);
      }
    });

    // Преобразуем Set обратно в массив объектов
    return Array.from(uniqueSpecialties).map((specialty, index) => ({
      id: index + 1, // Простой ID на основе индекса
      name: getCorrectedServiceName(specialty),
      value: specialty
    }));
  };

  // Функция для получения названия специализации по значению
  const getSpecialtyName = (specialtyValue) => {
    const specialties = getSpecialtiesFromCategories();
    const specialty = specialties.find(s => s.value === specialtyValue);
    return specialty ? specialty.name : specialtyValue;
  };

  // Функция для конвертации файла в base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Обработчик загрузки изображения
  const handleImageUpload = async (event, isEdit = false) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Лутфан фақат расм интихоб кунед");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Андозаи расм бояд аз 5MB хурдтар бошад");
        return;
      }

      try {
        toast.loading("Расм бор карда мешавад...");
        const base64 = await convertToBase64(file);

        if (isEdit && editingDoctor) {
          setEditingDoctor({ ...editingDoctor, img: base64 });
        } else {
          setNewDoctor({ ...newDoctor, img: base64 });
        }

        toast.dismiss();
        toast.success("Расм бомуваффақият бор карда шуд");
      } catch (error) {
        toast.dismiss();
        toast.error("Хатоги дар бор кардани расм");
      }
    }
  };

  // Обработчик добавления нового врача
  const handleAddDoctor = async (e) => {
    e.preventDefault();

    if (!newDoctor.name || !newDoctor.qualifications || !newDoctor.education || !newDoctor.specialty) {
      toast.error("Лутфан ҳамаи майдонҳои зарурӣ пур кунед");
      return;
    }

    toast.promise(
      async () => {
        await postDoctor(newDoctor);
        setShowAddForm(false);
        setNewDoctor({
          name: "",
          img: defaultDoctorImages[0],
          specialty: "",
          qualifications: "",
          education: "",
          professional_activity: "",
          experience: 0,
          rating: 0,
          reviews: 0,
          schedule: {
            "1": { start: 9, end: 18 },
            "2": { start: 9, end: 18 },
            "3": { start: 9, end: 18 },
            "4": { start: 9, end: 18 },
            "5": { start: 9, end: 17 },
            "6": { start: 10, end: 15 }
          }
        });
      },
      {
        loading: "Илова кардани доктор...",
        success: "Доктор бомуваффақият илова шуд!",
        error: "Хатоги дар илова кардани доктор"
      }
    );
  };

  // Обработчик редактирования врача
  const handleEditDoctor = async (e) => {
    e.preventDefault();

    if (!editingDoctor?.name || !editingDoctor?.qualifications || !editingDoctor?.education || !editingDoctor?.specialty) {
      toast.error("Лутфан ҳамаи майдонҳои зарурӣ пур кунед");
      return;
    }

    toast.promise(
      async () => {
        await updateDoctor(editingDoctor.id, {
          name: editingDoctor.name,
          img: editingDoctor.img,
          specialty: editingDoctor.specialty,
          qualifications: editingDoctor.qualifications,
          education: editingDoctor.education,
          professional_activity: editingDoctor.professional_activity,
          experience: editingDoctor.experience,
          rating: editingDoctor.rating,
          reviews: editingDoctor.reviews,
          schedule: editingDoctor.schedule
        });
        setShowEditForm(false);
        setEditingDoctor(null);
      },
      {
        loading: "Таҳрир кардани доктор...",
        success: "Доктор бомуваффақият таҳрир шуд!",
        error: "Хатоги дар таҳрир кардани доктор"
      }
    );
  };

  // Обработчик удаления врача
  const handleDeleteDoctor = async () => {
    toast.promise(
      async () => {
        await deleteDoctor(deleteDialog.id);
        setDeleteDialog({ open: false, id: null, name: "" });
      },
      {
        loading: "Нест кардани доктор...",
        success: "Доктор бомуваффақият нест шуд!",
        error: "Хатоги дар нест кардани доктор"
      }
    );
  };

  // Функция для открытия формы редактирования
  const openEditForm = (doctor) => {
    setEditingDoctor(doctor);
    setShowEditForm(true);
  };

  // Функция для открытия диалога удаления
  const openDeleteDialog = (doctor) => {
    setDeleteDialog({
      open: true,
      id: doctor.id,
      name: doctor.name
    });
  };

  // Обработчик изменения расписания
  const handleScheduleChange = (day, field, value, isEdit = false) => {
    const scheduleValue = parseInt(value);

    if (isEdit && editingDoctor) {
      setEditingDoctor({
        ...editingDoctor,
        schedule: {
          ...editingDoctor.schedule,
          [day]: {
            ...editingDoctor.schedule[day],
            [field]: scheduleValue
          }
        }
      });
    } else {
      setNewDoctor({
        ...newDoctor,
        schedule: {
          ...newDoctor.schedule,
          [day]: {
            ...newDoctor.schedule[day],
            [field]: scheduleValue
          }
        }
      });
    }
  };

  // Скелетон для таблицы
  const TableSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/6" />
          </div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );

  const specialties = getSpecialtiesFromCategories();

  return (
    <div className="min-h-screen bg-transparent p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок с кнопкой добавления */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Докторҳо</h1>
            <p className="text-muted-foreground">Идоракунии рӯйхати докторҳои клиника</p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="rounded-lg bg-primary hover:bg-primary/90"
            disabled={specialties.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Илова кардани доктор
          </Button>
        </div>

        {specialties.length === 0 && !isLoading && (
          <div className="mb-6 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800">
              Ягон категория пайдо нашуд. Лутфан аввал категорияҳоро илова кунед, то ки докторҳо илова карда шаванд.
            </p>
          </div>
        )}

        {/* Таблица врачей */}
        <Card className="bg-background/60 backdrop-blur-sm border-border/40 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Рӯйхати докторҳо</CardTitle>
            <CardDescription>
              Ҳамаи докторҳои система - {dataDoctors.length} нафар
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton />
            ) : dataDoctors.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center justify-center">
                  <BriefcaseMedical className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Докторҳо пайдо нашуд</h3>
                  <p className="text-muted-foreground">Ягон доктор ба система илова нашудааст</p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Доктор</TableHead>
                    <TableHead>Специализатсия</TableHead>
                    <TableHead>Таҷриба</TableHead>
                    <TableHead>Рейтинг</TableHead>
                    <TableHead className="text-right">Амалҳо</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataDoctors.map((doctor) => (
                    <TableRow key={doctor.id} className="group hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={doctor.img}
                            alt={doctor.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-medium">{doctor.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1 max-w-xs  ">
                              {doctor.qualifications}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-lg">
                          {getSpecialtyName(doctor.specialty)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <BriefcaseMedical className="w-3 h-3 text-muted-foreground" />
                          <span>{doctor.experience} сол</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{doctor.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditForm(doctor)}
                            className="h-8 w-8 p-0 rounded-lg"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(doctor)}
                            className="h-8 w-8 p-0 rounded-lg text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Модальное окно добавления врача */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-border/50 rounded-2xl max-h-[90vh] overflow-y-auto custom-scroll">
            <DialogHeader className="border-b border-border/30 pb-4">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Илова кардани доктори нав
              </DialogTitle>
              <DialogDescription>
                Маълумоти доктори навро ворид кунед
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddDoctor} className="space-y-6 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Номи доктор *
                  </Label>
                  <Input
                    id="name"
                    required
                    value={newDoctor.name}
                    onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                    placeholder="Доктор Иванов"
                    className="rounded-lg"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="specialty" className="text-sm font-medium">
                    Специализатсия *
                  </Label>
                  <Select
                    value={newDoctor.specialty}
                    onValueChange={(value) => setNewDoctor({ ...newDoctor, specialty: value })}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Специализатсияро интихоб кунед" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty.id} value={specialty.value}>
                          {specialty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="qualifications" className="text-sm font-medium">
                  дар бораи духтур
                </Label>
                <Textarea
                  id="professional_activity"
                  value={newDoctor.professional_activity}
                  onChange={(e) => setNewDoctor({ ...newDoctor, professional_activity: e.target.value })}
                  placeholder="Проведение операций на сосудах, ангиографии..."
                  className="rounded-lg min-h-[80px]"
                />

              </div>

              <div className="space-y-3">
                <Label htmlFor="education" className="text-sm font-medium">
                  Маълумот *
                </Label>

                <Textarea
                  id="education"
                  required
                  value={newDoctor.education}
                  onChange={(e) => setNewDoctor({ ...newDoctor, education: e.target.value })}
                  placeholder="Российский национальный исследовательский медицинский университет им. Н.И. Пирогова..."
                  className="rounded-lg min-h-[80px]"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="professional_activity" className="text-sm font-medium">
                  фаолияташ
                </Label>
                <Input
                  id="qualifications"
                  required
                  value={newDoctor.qualifications}
                  onChange={(e) => setNewDoctor({ ...newDoctor, qualifications: e.target.value })}
                  placeholder="Сосудистый хирург высшей категории"
                  className="rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="experience" className="text-sm font-medium">
                    Таҷриба (сол) *
                  </Label>
                  <Input
                    id="experience"
                    type="number"
                    required
                    min="0"
                    value={newDoctor.experience}
                    onChange={(e) => setNewDoctor({ ...newDoctor, experience: parseInt(e.target.value) || 0 })}
                    className="rounded-lg"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="rating" className="text-sm font-medium">
                    Рейтинг
                  </Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={newDoctor.rating}
                    onChange={(e) => setNewDoctor({ ...newDoctor, rating: parseFloat(e.target.value) || 0 })}
                    className="rounded-lg"
                  />
                </div>
              </div>

              {/* Расписание */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Расписание
                </Label>
                <div className="space-y-2 border rounded-lg p-4">
                  {Object.entries(weekDays).map(([day, dayName]) => (
                    <div key={day} className="flex items-center justify-between">
                      <span className="text-sm w-24">{dayName}</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={newDoctor.schedule[day]?.start || 9}
                          onChange={(e) => handleScheduleChange(day, 'start', e.target.value)}
                          className="w-16 rounded-lg text-center"
                        />
                        <span>-</span>
                        <Input
                          type="number"
                          min="0"
                          max="23"
                          value={newDoctor.schedule[day]?.end || 18}
                          onChange={(e) => handleScheduleChange(day, 'end', e.target.value)}
                          className="w-16 rounded-lg text-center"
                        />
                        <span className="text-xs text-muted-foreground">соат</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Изображение */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Тасвири доктор
                </Label>

                <div className="flex justify-center mb-3">
                  <div className="relative w-32 h-32 border-2 border-dashed border-border/50 rounded-full overflow-hidden">
                    <img
                      src={newDoctor.img}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-upload" className="flex items-center gap-2 cursor-pointer">
                    <Upload className="h-4 w-4" />
                    Бор кардани расм
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false)}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">
                    Форматҳои иҷозатдодашуда: JPG, PNG, GIF. Андозаи максималӣ: 5MB
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-border/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg"
                >
                  <X className="w-4 h-4 mr-2" />
                  Бекор кардан
                </Button>
                <Button
                  type="submit"
                  className="rounded-lg bg-primary hover:bg-primary/90"
                  disabled={!newDoctor.specialty}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Илова кардан
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Модальное окно редактирования врача */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-border/50 rounded-2xl max-h-[90vh] overflow-y-auto custom-scroll">
            <DialogHeader className="border-b border-border/30 pb-4">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Таҳрир кардани доктор
              </DialogTitle>
              <DialogDescription>
                Маълумоти докторро таҳрир кунед
              </DialogDescription>
            </DialogHeader>
            {editingDoctor && (
              <form onSubmit={handleEditDoctor} className="space-y-6 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="edit-name" className="text-sm font-medium">
                      Номи доктор *
                    </Label>
                    <Input
                      id="edit-name"
                      required
                      value={editingDoctor.name}
                      onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="edit-specialty" className="text-sm font-medium">
                      Специализатсия *
                    </Label>
                    <Select
                      value={editingDoctor.specialty}
                      onValueChange={(value) => setEditingDoctor({ ...editingDoctor, specialty: value })}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map((specialty) => (
                          <SelectItem key={specialty.id} value={specialty.value}>
                            {specialty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-qualifications" className="text-sm font-medium">
                    Квалификатсия *
                  </Label>
                  <Input
                    id="edit-qualifications"
                    required
                    value={editingDoctor.qualifications}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, qualifications: e.target.value })}
                    className="rounded-lg"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-education" className="text-sm font-medium">
                    Маълумот *
                  </Label>
                  <Textarea
                    id="edit-education"
                    required
                    value={editingDoctor.education}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, education: e.target.value })}
                    className="rounded-lg min-h-[80px]"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-professional_activity" className="text-sm font-medium">
                    Фаъолияти касбӣ
                  </Label>
                  <Textarea
                    id="edit-professional_activity"
                    value={editingDoctor.professional_activity}
                    onChange={(e) => setEditingDoctor({ ...editingDoctor, professional_activity: e.target.value })}
                    className="rounded-lg min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="edit-experience" className="text-sm font-medium">
                      Таҷриба (сол) *
                    </Label>
                    <Input
                      id="edit-experience"
                      type="number"
                      required
                      min="0"
                      value={editingDoctor.experience}
                      onChange={(e) => setEditingDoctor({ ...editingDoctor, experience: parseInt(e.target.value) || 0 })}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="edit-rating" className="text-sm font-medium">
                      Рейтинг
                    </Label>
                    <Input
                      id="edit-rating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={editingDoctor.rating}
                      onChange={(e) => setEditingDoctor({ ...editingDoctor, rating: parseFloat(e.target.value) || 0 })}
                      className="rounded-lg"
                    />
                  </div>
                </div>

                {/* Расписание */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Расписание
                  </Label>
                  <div className="space-y-2 border rounded-lg p-4">
                    {Object.entries(weekDays).map(([day, dayName]) => (
                      <div key={day} className="flex items-center justify-between">
                        <span className="text-sm w-24">{dayName}</span>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={editingDoctor.schedule[day]?.start || 9}
                            onChange={(e) => handleScheduleChange(day, 'start', e.target.value, true)}
                            className="w-16 rounded-lg text-center"
                          />
                          <span>-</span>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={editingDoctor.schedule[day]?.end || 18}
                            onChange={(e) => handleScheduleChange(day, 'end', e.target.value, true)}
                            className="w-16 rounded-lg text-center"
                          />
                          <span className="text-xs text-muted-foreground">соат</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Изображение */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Тасвири доктор
                  </Label>

                  <div className="flex justify-center mb-3">
                    <div className="relative w-32 h-32 border-2 border-dashed border-border/50 rounded-full overflow-hidden">
                      <img
                        src={editingDoctor.img}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-file-upload" className="flex items-center gap-2 cursor-pointer">
                      <Upload className="h-4 w-4" />
                      Бор кардани расм аз компютер
                    </Label>
                    <Input
                      id="edit-file-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      Форматҳои иҷозатдодашуда: JPG, PNG, GIF. Андозаи максималӣ: 5MB
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-border/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingDoctor(null);
                    }}
                    className="rounded-lg"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Бекор кардан
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-lg bg-primary hover:bg-primary/90"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Таҳрир кардан
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Диалог подтверждения удаления */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-border/50 rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-lg">
                <Trash2 className="h-5 w-5 text-destructive" />
                Докторро нест кардан?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Шумо боварӣ доред, ки мехоҳед доктори "{deleteDialog.name}"-ро нест кунед? Ин амал бозгашт надорад.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-lg">
                Бекор кардан
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteDoctor}
                className="rounded-lg bg-destructive hover:bg-destructive/90"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Нест кардан
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Doctors;
