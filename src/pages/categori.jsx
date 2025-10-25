import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { adminDataStore } from '@/app/zustand';
import { ArrowRight, Stethoscope, Heart, Brain, Eye, Baby, Scan, Activity, Sparkles, Plus, Edit, Trash2, X, Upload, Image } from 'lucide-react';
import { toast } from "sonner";

// Иконки для разных категорий
const categoryIcons = {
  "Сосудистая хирургия": Heart,
  "Общая хирургия": Stethoscope,
  "Колопроктология": Activity,
  "Флебология": Activity,
  "Гинекология": Baby,
  "Доплерография": Scan,
  "УЗИ-диагностика": Eye,
  "default": Stethoscope
};

// Медицинские изображения по умолчанию
const defaultMedicalImages = [
  "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1551076805-e1869033e561?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=600&h=400&fit=crop"
];

const Categori = () => {
  const { getDataCategory, dataCateg, postCategory, updateCategory, deleteCategory } = adminDataStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, title: "" });
  const [editingCategory, setEditingCategory] = useState(null);

  const [newCategory, setNewCategory] = useState({
    sohaiKlinik: "",
    descKlinik: "",
    img: defaultMedicalImages[0]
  });

  useEffect(() => {
    const loadData = async () => {
      await getDataCategory();
      setIsLoading(false);
    };
    loadData();
  }, [getDataCategory]);

  // Функция для исправления опечатки в названии услуги
  const getCorrectedServiceName = (serviceName) => {
    if (serviceName === "УЗИ-диагностикаa") {
      return "УЗИ-диагностика";
    }
    return serviceName;
  };

  // Функция для получения иконки категории
  const getCategoryIcon = (categoryName) => {
    const IconComponent = categoryIcons[categoryName] || categoryIcons.default;
    return <IconComponent className="h-5 w-5" />;
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
      // Проверка типа файла
      if (!file.type.startsWith('image/')) {
        toast.error("Лутфан фақат расм интихоб кунед");
        return;
      }

      // Проверка размера файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Андозаи расм бояд аз 5MB хурдтар бошад");
        return;
      }

      try {
        toast.loading("Расм бор карда мешавад...");
        const base64 = await convertToBase64(file);

        if (isEdit && editingCategory) {
          setEditingCategory({ ...editingCategory, img: base64 });
        } else {
          setNewCategory({ ...newCategory, img: base64 });
        }

        toast.dismiss();
        toast.success("Расм бомуваффақият бор карда шуд");
      } catch (error) {
        toast.dismiss();
        toast.error("Хатоги дар бор кардани расм");
      }
    }
  };

  // Обработчик добавления новой категории
  const handleAddCategory = async (e) => {
    e.preventDefault();

    if (!newCategory.sohaiKlinik || !newCategory.descKlinik) {
      toast.error("Лутфан ҳамаи майдонҳоро пур кунед");
      return;
    }

    toast.promise(
      async () => {
        await postCategory(newCategory);
        setShowAddForm(false);
        setNewCategory({
          sohaiKlinik: "",
          descKlinik: "",
          img: defaultMedicalImages[0]
        });
      },
      {
        loading: "Илова кардани категория...",
        success: "Категория бомуваффақият илова шуд!",
        error: "Хатоги дар илова кардани категория"
      }
    );
  };

  // Обработчик редактирования категории
  const handleEditCategory = async (e) => {
    e.preventDefault();

    if (!editingCategory?.sohaiKlinik || !editingCategory?.descKlinik) {
      toast.error("Лутфан ҳамаи майдонҳоро пур кунед");
      return;
    }

    toast.promise(
      async () => {
        await updateCategory(editingCategory.id, {
          sohaiKlinik: editingCategory.sohaiKlinik,
          descKlinik: editingCategory.descKlinik,
          img: editingCategory.img
        });
        setShowEditForm(false);
        setEditingCategory(null);
      },
      {
        loading: "Таҳрир кардани категория...",
        success: "Категория бомуваффақият таҳрир шуд!",
        error: "Хатоги дар таҳрир кардани категория"
      }
    );
  };

  // Обработчик удаления категории
  const handleDeleteCategory = async () => {
    toast.promise(
      async () => {
        await deleteCategory(deleteDialog.id);
        setDeleteDialog({ open: false, id: null, title: "" });
      },
      {
        loading: "Нест кардани категория...",
        success: "Категория бомуваффақият нест шуд!",
        error: "Хатоги дар нест кардани категория"
      }
    );
  };

  // Функция для открытия формы редактирования
  const openEditForm = (category) => {
    setEditingCategory(category);
    setShowEditForm(true);
  };

  // Функция для открытия диалога удаления
  const openDeleteDialog = (category) => {
    setDeleteDialog({
      open: true,
      id: category.id,
      title: getCorrectedServiceName(category.sohaiKlinik)
    });
  };

  // Скелетон для карточки
  const CardSkeleton = () => (
    <Card className="overflow-hidden bg-background/50 backdrop-blur-sm border-border/50 rounded-2xl">
      <Skeleton className="w-full h-48 rounded-none" />
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-lg mt-2" />
        <Skeleton className="h-4 w-2/3 rounded-lg" />
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-16 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-transparent from-background via-background to-muted/10 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок с кнопкой добавления */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-background/60 backdrop-blur-sm border border-border/40 mb-6 shadow-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Хизматрасониҳои тиббӣ</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Хизматрасониҳои мо
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
            Мо хизматрасониҳои тиббии пурсифатро бо истеъмоли навтарин технологияҳо пешниҳод мекунем
          </p>

          {/* Кнопка добавления */}
          <Button
            onClick={() => setShowAddForm(true)}
            className="rounded-xl bg-primary/90 hover:bg-primary backdrop-blur-sm border border-primary/20 shadow-lg transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Илова кардани категория
          </Button>
        </div>

        {/* Сетка карточек */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : dataCateg.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex flex-col items-center justify-center">
              <div className="p-6 rounded-2xl bg-muted/30 backdrop-blur-sm border border-border/40 mb-6">
                <Stethoscope className="w-16 h-16 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Хизматрасониҳо дастрас нестанд</h3>
              <p className="text-muted-foreground text-lg">Ягон хизматрасонӣ пайдо нашуд</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataCateg.map((category) => {
              const correctedName = getCorrectedServiceName(category.sohaiKlinik);

              return (
                <Card
                  key={category.id}
                  className="group overflow-hidden pb-4 px-0 pt-0 bg-background/60 backdrop-blur-sm border-border/40 rounded-2xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] cursor-pointer hover:bg-background/70 border relative"
                >
                  {/* Кнопки действий */}
                  <div className="absolute top-2 right-3 z-10 flex gap-2 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditForm(category);
                      }}
                      className="h-8 w-8 p-0 rounded-lg bg-background/80 backdrop-blur-sm border border-border/40 hover:bg-blue-500/20 hover:border-blue-300/50"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteDialog(category);
                      }}
                      className="h-8 w-8 p-0 rounded-lg bg-background/80 backdrop-blur-sm border border-border/40 hover:bg-red-500/20 hover:border-red-300/50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="relative overflow-hidden">
                    <img
                      src={category.img}
                      alt={correctedName}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Бейдж ID */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-background/80 backdrop-blur-sm text-foreground border-border/40 rounded-lg px-2 py-1 text-xs font-medium">
                        #{category.id}
                      </Badge>
                    </div>

                    {/* Иконка категории */}
                    {/* <div className="absolute top-3 right-12 p-2 rounded-xl bg-background/80 backdrop-blur-sm border border-border/40 group-hover:bg-primary/20 group-hover:border-primary/30 transition-all duration-300">
                      {getCategoryIcon(category.sohaiKlinik)}
                    </div> */}
                  </div>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors duration-300">
                      {correctedName}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                      {category.descKlinik}
                    </CardDescription>
                  </CardContent>

                  {/* Акцентная полоса */}
                  <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-primary to-primary/50 group-hover:w-full transition-all duration-500"></div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Модальное окно добавления категории */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-border/50 rounded-2xl ">
            <DialogHeader className="border-b border-border/30 ">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Илова кардани категорияи навро
              </DialogTitle>
              <DialogDescription>
                Маълумоти категорияи навро ворид кунед
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCategory} className="space-y-6 py-2">
              <div className="space-y-3">
                <Label htmlFor="sohaiKlinik" className="text-sm font-medium text-foreground/80">
                  Номи хизматрасонӣ *
                </Label>
                <Input
                  id="sohaiKlinik"
                  required
                  value={newCategory.sohaiKlinik}
                  onChange={(e) => setNewCategory({ ...newCategory, sohaiKlinik: e.target.value })}
                  placeholder="Сосудистая хирургия"
                  className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="descKlinik" className="text-sm font-medium text-foreground/80">
                  Тавсифи хизматрасонӣ *
                </Label>
                <Textarea
                  id="descKlinik"
                  required
                  value={newCategory.descKlinik}
                  onChange={(e) => setNewCategory({ ...newCategory, descKlinik: e.target.value })}
                  placeholder="Лечение сосудистых заболеваний и восстановление кровообращения."
                  className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 min-h-[100px]"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground/80">
                  Тасвир
                </Label>

                {/* Предпросмотр изображения */}
                <div className="flex justify-center mb-3">
                  <div className="relative w-full h-48 border-2 border-dashed border-border/50 rounded-xl overflow-hidden">
                    <img
                      src={newCategory.img}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Загрузка файла */}
                <div className="space-y-2">
                  <Label htmlFor="file-upload" className="flex items-center justify-center gap-2 cursor-pointer ">
                    <Upload className="h-5 w-5" />
                    Бор кардани расм аз компютер
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false)}
                      className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 hidden"
                  />
                  <p className="text-xs text-muted-foreground">
                    Форматҳои иҷозатдодашуда: JPG, PNG, GIF. Андозаи максималӣ: 5MB
                  </p>
                </div>

                {/* Или использовать URL */}

              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-border/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewCategory({
                      sohaiKlinik: "",
                      descKlinik: "",
                      img: defaultMedicalImages[0]
                    });
                  }}
                  className="rounded-xl border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  Бекор кардан
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl bg-primary/90 hover:bg-primary backdrop-blur-sm border border-primary/20 shadow-lg transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Илова кардан
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Модальное окно редактирования категории */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-border/50 rounded-2xl">
            <DialogHeader className="border-b border-border/30 pb-4">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Таҳрир кардани категория
              </DialogTitle>
              <DialogDescription>
                Маълумоти категорияро таҳрир кунед
              </DialogDescription>
            </DialogHeader>
            {editingCategory && (
              <form onSubmit={handleEditCategory} className="space-y-6 py-2">
                <div className="space-y-3">
                  <Label htmlFor="edit-sohaiKlinik" className="text-sm font-medium text-foreground/80">
                    Номи хизматрасонӣ *
                  </Label>
                  <Input
                    id="edit-sohaiKlinik"
                    required
                    value={editingCategory.sohaiKlinik}
                    onChange={(e) => setEditingCategory({ ...editingCategory, sohaiKlinik: e.target.value })}
                    className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-descKlinik" className="text-sm font-medium text-foreground/80">
                    Тавсифи хизматрасонӣ *
                  </Label>
                  <Textarea
                    id="edit-descKlinik"
                    required
                    value={editingCategory.descKlinik}
                    onChange={(e) => setEditingCategory({ ...editingCategory, descKlinik: e.target.value })}
                    className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 min-h-[100px]"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground/80">
                    Тасвир
                  </Label>

                  {/* Предпросмотр изображения */}
                  <div className="flex justify-center mb-3">
                    <div className="relative w-full h-48 border-2 border-dashed border-border/50 rounded-xl overflow-hidden">
                      <img
                        src={editingCategory.img}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Загрузка файла */}
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
                      className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      Форматҳои иҷозатдодашуда: JPG, PNG, GIF. Андозаи максималӣ: 5MB
                    </p>
                  </div>

                  {/* Или использовать URL */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/40" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background/95 px-2 text-muted-foreground">Ё</span>
                    </div>
                  </div>

                  <Label htmlFor="edit-img" className="text-sm font-medium text-foreground/80">
                    URL-и сурат
                  </Label>
                  <Input
                    id="edit-img"
                    value={editingCategory.img}
                    onChange={(e) => setEditingCategory({ ...editingCategory, img: e.target.value })}
                    className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {defaultMedicalImages.map((img, index) => (
                      <div
                        key={index}
                        className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all duration-200 ${editingCategory.img === img ? 'border-primary ring-2 ring-primary/20' : 'border-border/50'
                          }`}
                        onClick={() => setEditingCategory({ ...editingCategory, img })}
                      >
                        <img src={img} alt={`Option ${index + 1}`} className="w-full h-16 object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-border/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingCategory(null);
                    }}
                    className="rounded-xl border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-200"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Бекор кардан
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-xl bg-primary/90 hover:bg-primary backdrop-blur-sm border border-primary/20 shadow-lg transition-all duration-200"
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
                Категорияро нест кардан?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Шумо боварӣ доред, ки мехоҳед категорияи "{deleteDialog.title}"-ро нест кунед? Ин амал бозгашт надорад.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-200">
                Бекор кардан
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCategory}
                className="rounded-xl bg-destructive/90 hover:bg-destructive backdrop-blur-sm border border-destructive/20 shadow-lg transition-all duration-200"
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

export default Categori;
