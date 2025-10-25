import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { adminDataStore } from '@/app/zustand';
import { Plus, Edit, Trash2, X, Play, User, Calendar, Star, Upload, Video } from 'lucide-react';
import { toast } from "sonner";

const Otziv = () => {
  const { getDataReviews, dataReviews, postReview, updateReview, deleteReview } = adminDataStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: "" });
  const [editingReview, setEditingReview] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [newReview, setNewReview] = useState({
    name: "",
    position: "",
    videoBase64: "",
    videoFileName: "",
    description: "",
    rating: 5,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const loadData = async () => {
      await getDataReviews();
      setIsLoading(false);
    };
    loadData();
  }, [getDataReviews]);

  // Функция для конвертации видео в Base64
  const convertVideoToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve({
        base64: reader.result,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      reader.onerror = error => reject(error);
    });
  };

  // Обработчик загрузки видео
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('video/')) {
      toast.error("Лутфан файли видеоро интихоб кунед");
      return;
    }

    // Проверка размера файла (максимум 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Андозаи видео набояд аз 50MB зиёд бошад");
      return;
    }

    setUploading(true);
    try {
      const videoData = await convertVideoToBase64(file);
      setNewReview({
        ...newReview,
        videoBase64: videoData.base64,
        videoFileName: videoData.fileName
      });
      toast.success("Видео бомуваффақият бор карда шуд");
    } catch (error) {
      console.error('Error converting video:', error);
      toast.error("Хатоги дар боркунии видео");
    } finally {
      setUploading(false);
    }
  };

  // Обработчик загрузки видео для редактирования
  const handleEditVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error("Лутфан файли видеоро интихоб кунед");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("Андозаи видео набояд аз 50MB зиёд бошад");
      return;
    }

    setUploading(true);
    try {
      const videoData = await convertVideoToBase64(file);
      setEditingReview({
        ...editingReview,
        videoBase64: videoData.base64,
        videoFileName: videoData.fileName
      });
      toast.success("Видео бомуваффақият бор карда шуд");
    } catch (error) {
      console.error('Error converting video:', error);
      toast.error("Хатоги дар боркунии видео");
    } finally {
      setUploading(false);
    }
  };

  // Обработчик добавления нового отзыва
  const handleAddReview = async (e) => {
    e.preventDefault();

    if (!newReview.name || !newReview.videoBase64) {
      toast.error("Лутфан ном ва видеоро ворид кунед");
      return;
    }

    toast.promise(
      async () => {
        await postReview(newReview);
        setShowAddForm(false);
        setNewReview({
          name: "",
          position: "",
          videoBase64: "",
          videoFileName: "",
          description: "",
          rating: 5,
          date: new Date().toISOString().split('T')[0]
        });
      },
      {
        loading: "Илова кардани видео-отзыв...",
        success: "Видео-отзыв бомуваффақият илова шуд!",
        error: "Хатоги дар илова кардани видео-отзыв"
      }
    );
  };

  // Обработчик редактирования отзыва
  const handleEditReview = async (e) => {
    e.preventDefault();

    if (!editingReview?.name || !editingReview?.videoBase64) {
      toast.error("Лутфан ном ва видеоро ворид кунед");
      return;
    }

    toast.promise(
      async () => {
        await updateReview(editingReview.id, {
          name: editingReview.name,
          position: editingReview.position,
          videoBase64: editingReview.videoBase64,
          videoFileName: editingReview.videoFileName,
          description: editingReview.description,
          rating: editingReview.rating,
          date: editingReview.date
        });
        setShowEditForm(false);
        setEditingReview(null);
      },
      {
        loading: "Таҳрир кардани видео-отзыв...",
        success: "Видео-отзыв бомуваффақият таҳрир шуд!",
        error: "Хатоги дар таҳрир кардани видео-отзыв"
      }
    );
  };

  // Обработчик удаления отзыва
  const handleDeleteReview = async () => {
    toast.promise(
      async () => {
        await deleteReview(deleteDialog.id);
        setDeleteDialog({ open: false, id: null, name: "" });
      },
      {
        loading: "Нест кардани видео-отзыв...",
        success: "Видео-отзыв бомуваффақият нест шуд!",
        error: "Хатоги дар нест кардани видео-отзыв"
      }
    );
  };

  // Функция для открытия формы редактирования
  const openEditForm = (review) => {
    setEditingReview(review);
    setShowEditForm(true);
  };

  // Функция для открытия диалога удаления
  const openDeleteDialog = (review) => {
    setDeleteDialog({
      open: true,
      id: review.id,
      name: review.name
    });
  };

  // Функция для открытия видео в модальном окне
  const openVideoModal = (review) => {
    setSelectedVideo(review);
  };

  // Форматирование размера файла
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  // Компонент рейтинга
  const RatingStars = ({ rating }) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-2">{rating}.0</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок с кнопкой добавления */}
        <div className=" mb-16 flex items-center justify-between">
          <div>
          <h1 className="text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Видео-отзывы
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
            Реальные отзывы наших пациентов - честные мнения о качестве обслуживания
          </p>
        </div>

          {/* Кнопка добавления */}
          <Button
            onClick={() => setShowAddForm(true)}
            className="rounded-xl bg-primary/90 hover:bg-primary backdrop-blur-sm border border-primary/20 shadow-lg transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Илова кардани видео-отзыв
          </Button>
        </div>

        {/* Сетка карточек видео-отзывов */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : dataReviews.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex flex-col items-center justify-center">
              <div className="p-6 rounded-2xl bg-muted/30 backdrop-blur-sm border border-border/40 mb-6">
                <Play className="w-16 h-16 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Видео-отзывҳо пайдо нашуд</h3>
              <p className="text-muted-foreground text-lg">Ягон видео-отзыв пайдо нашуд</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataReviews.map((review) => (
              <Card
                key={review.id}
                className="group overflow-hidden bg-background/60 backdrop-blur-sm border-border/40 rounded-2xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] cursor-pointer hover:bg-background/70 border relative"
              >
                {/* Кнопки действий */}
                <div className="absolute top-4 right-4 z-10 flex gap-2 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditForm(review);
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
                      openDeleteDialog(review);
                    }}
                    className="h-8 w-8 p-0 rounded-lg bg-background/80 backdrop-blur-sm border border-border/40 hover:bg-red-500/20 hover:border-red-300/50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Видео превью */}
                <div
                  className="w-full h-48 overflow-hidden relative cursor-pointer bg-gradient-to-br from-muted/50 to-muted/30"
                  onClick={() => openVideoModal(review)}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-3">
                      <Video className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center px-4">
                      {review.videoFileName || "Видео файл"}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Play className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">Дидан видео</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors duration-300 line-clamp-1">
                      {review.name}
                    </CardTitle>
                    <Badge className="bg-background/80 backdrop-blur-sm text-foreground border-border/40 rounded-lg px-2 py-1 text-xs font-medium">
                      #{review.id}
                    </Badge>
                  </div>

                  {review.position && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="h-3 w-3" />
                      {review.position}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <RatingStars rating={review.rating || 5} />
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{review.date}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {review.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {review.description}
                    </p>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openVideoModal(review)}
                    className="w-full mt-4 rounded-xl bg-background/50 backdrop-blur-sm border-border/40 hover:bg-primary/20 hover:border-primary/50 transition-all duration-300 group/video"
                  >
                    <Play className="h-4 w-4 mr-2 group-hover/video:scale-110 transition-transform duration-300" />
                    Дидан видео
                  </Button>
                </CardContent>

                {/* Акцентная полоса */}
                <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-primary to-primary/50 group-hover:w-full transition-all duration-500"></div>
              </Card>
            ))}
          </div>
        )}

        {/* Модальное окно просмотра видео */}
        <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
          <DialogContent className="sm:max-w-4xl bg-background/95 backdrop-blur-xl border-border/50 rounded-2xl">
            <DialogHeader className="border-b border-border/30 pb-4">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                {selectedVideo?.name}
              </DialogTitle>
              <DialogDescription>
                {selectedVideo?.position} • {selectedVideo?.date}
              </DialogDescription>
            </DialogHeader>

            {selectedVideo && (
              <div className="space-y-4">
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                  <video
                    controls
                    className="w-full h-full"
                    src={selectedVideo.videoBase64}
                    poster={selectedVideo.videoThumbnail}
                  >
                    Ваш браузер видео-файлҳоро дастгирӣ намекунад.
                  </video>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Файли видео: {selectedVideo.videoFileName || "Номаълум"}</span>
                  {selectedVideo.videoFileSize && (
                    <span>Андоза: {formatFileSize(selectedVideo.videoFileSize)}</span>
                  )}
                </div>
              </div>
            )}

            {selectedVideo?.description && (
              <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-sm text-muted-foreground">{selectedVideo.description}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => setSelectedVideo(null)}
                className="rounded-xl border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-200"
              >
                <X className="w-4 h-4 mr-2" />
                Пӯшидан
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Модальное окно добавления отзыва */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-border/50 rounded-2xl overflow-y-auto scrollbar-thumb-transparent scrollbar-track-transparent custom-scroll max-h-[95vh]">
            <DialogHeader className="border-b border-border/30 pb-4">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Илова кардани видео-отзыв
              </DialogTitle>
              <DialogDescription>
                Маълумоти видео-отзыви навро ворид кунед
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddReview} className="space-y-6 py-2">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-medium text-foreground/80">
                  Номи пациент *
                </Label>
                <Input
                  id="name"
                  required
                  value={newReview.name}
                  onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                  placeholder="Фаррух Неъматов"
                  className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="position" className="text-sm font-medium text-foreground/80">
                  Вазифа ё услуга
                </Label>
                <Input
                  id="position"
                  value={newReview.position}
                  onChange={(e) => setNewReview({ ...newReview, position: e.target.value })}
                  placeholder="Бемори дил, услугаи ECG"
                  className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>

              {/* Поле загрузки видео */}
              <div className="space-y-3">
                <Label htmlFor="videoFile" className="text-sm font-medium text-foreground/80">
                  Файли видео *
                </Label>
                <div className="border-2 border-dashed border-border/40 rounded-xl p-6 text-center transition-all duration-200 hover:border-primary/40 hover:bg-primary/5">
                  <input
                    id="videoFile"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <label htmlFor="videoFile" className="cursor-pointer">
                    {uploading ? (
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                        <p className="text-sm text-muted-foreground">Бор кардани видео...</p>
                      </div>
                    ) : newReview.videoBase64 ? (
                      <div className="flex flex-col items-center">
                        <Video className="h-8 w-8 text-green-500 mb-2" />
                        <p className="text-sm font-medium text-foreground">{newReview.videoFileName}</p>
                        <p className="text-xs text-muted-foreground mt-1">Видео бомуваффақият бор карда шуд</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setNewReview({ ...newReview, videoBase64: "", videoFileName: "" })}
                        >
                          Интихоби дигар
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium text-foreground">Файли видеоро интихоб кунед</p>
                        <p className="text-xs text-muted-foreground mt-1">MP4, MOV, AVI (то 50MB)</p>
                        <Button type="button" variant="outline" size="sm" className="mt-2">
                          Бор кардани видео
                        </Button>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="rating" className="text-sm font-medium text-foreground/80">
                  Рейтинг
                </Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className="p-1 hover:scale-110 transition-transform duration-200"
                    >
                      <Star
                        className={`h-6 w-6 ${star <= newReview.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                          }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    {newReview.rating}.0
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="date" className="text-sm font-medium text-foreground/80">
                  Сана
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={newReview.date}
                  onChange={(e) => setNewReview({ ...newReview, date: e.target.value })}
                  className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-sm font-medium text-foreground/80">
                  Тавсифи кӯтоҳ
                </Label>
                <Textarea
                  id="description"
                  value={newReview.description}
                  onChange={(e) => setNewReview({ ...newReview, description: e.target.value })}
                  placeholder="Тавсифи кӯтоҳ дар бораи отзыв..."
                  className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 min-h-[80px]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-border/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewReview({
                      name: "",
                      position: "",
                      videoBase64: "",
                      videoFileName: "",
                      description: "",
                      rating: 5,
                      date: new Date().toISOString().split('T')[0]
                    });
                  }}
                  className="rounded-xl border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-200"
                >
                  <X className="w-4 h-4 mr-2" />
                  Бекор кардан
                </Button>
                <Button
                  type="submit"
                  disabled={!newReview.videoBase64 || uploading}
                  className="rounded-xl bg-primary/90 hover:bg-primary backdrop-blur-sm border border-primary/20 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Илова кардан
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Модальное окно редактирования отзыва */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-border/50 rounded-2xl overflow-y-auto scrollbar-thumb-transparent scrollbar-track-transparent custom-scroll max-h-[95vh]">
            <DialogHeader className="border-b border-border/30 pb-4">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Таҳрир кардани видео-отзыв
              </DialogTitle>
              <DialogDescription>
                Маълумоти видео-отзывро таҳрир кунед
              </DialogDescription>
            </DialogHeader>
            {editingReview && (
              <form onSubmit={handleEditReview} className="space-y-6 py-2">
                <div className="space-y-3">
                  <Label htmlFor="edit-name" className="text-sm font-medium text-foreground/80">
                    Номи пациент *
                  </Label>
                  <Input
                    id="edit-name"
                    required
                    value={editingReview.name}
                    onChange={(e) => setEditingReview({ ...editingReview, name: e.target.value })}
                    className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-position" className="text-sm font-medium text-foreground/80">
                    Вазифа ё услуга
                  </Label>
                  <Input
                    id="edit-position"
                    value={editingReview.position || ''}
                    onChange={(e) => setEditingReview({ ...editingReview, position: e.target.value })}
                    className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                </div>

                {/* Поле загрузки видео для редактирования */}
                <div className="space-y-3">
                  <Label htmlFor="edit-videoFile" className="text-sm font-medium text-foreground/80">
                    Файли видео *
                  </Label>
                  <div className="border-2 border-dashed border-border/40 rounded-xl p-6 text-center transition-all duration-200 hover:border-primary/40 hover:bg-primary/5">
                    <input
                      id="edit-videoFile"
                      type="file"
                      accept="video/*"
                      onChange={handleEditVideoUpload}
                      className="hidden"
                    />
                    <label htmlFor="edit-videoFile" className="cursor-pointer">
                      {uploading ? (
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                          <p className="text-sm text-muted-foreground">Бор кардани видео...</p>
                        </div>
                      ) : editingReview.videoBase64 ? (
                        <div className="flex flex-col items-center">
                          <Video className="h-8 w-8 text-green-500 mb-2" />
                          <p className="text-sm font-medium text-foreground">{editingReview.videoFileName}</p>
                          <p className="text-xs text-muted-foreground mt-1">Видео бомуваффақият бор карда шуд</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => setEditingReview({ ...editingReview, videoBase64: "", videoFileName: "" })}
                          >
                            Интихоби дигар
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium text-foreground">Файли видеоро интихоб кунед</p>
                          <p className="text-xs text-muted-foreground mt-1">MP4, MOV, AVI (то 50MB)</p>
                          <Button type="button" variant="outline" size="sm" className="mt-2">
                            Бор кардани видео
                          </Button>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-rating" className="text-sm font-medium text-foreground/80">
                    Рейтинг
                  </Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setEditingReview({ ...editingReview, rating: star })}
                        className="p-1 hover:scale-110 transition-transform duration-200"
                      >
                        <Star
                          className={`h-6 w-6 ${star <= (editingReview.rating || 5)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                            }`}
                        />
                      </button>
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">
                      {(editingReview.rating || 5)}.0
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-date" className="text-sm font-medium text-foreground/80">
                    Сана
                  </Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingReview.date || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEditingReview({ ...editingReview, date: e.target.value })}
                    className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-description" className="text-sm font-medium text-foreground/80">
                    Тавсифи кӯтоҳ
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={editingReview.description || ''}
                    onChange={(e) => setEditingReview({ ...editingReview, description: e.target.value })}
                    className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 min-h-[80px]"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-border/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingReview(null);
                    }}
                    className="rounded-xl border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-200"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Бекор кардан
                  </Button>
                  <Button
                    type="submit"
                    disabled={!editingReview.videoBase64 || uploading}
                    className="rounded-xl bg-primary/90 hover:bg-primary backdrop-blur-sm border border-primary/20 shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                Видео-отзывро нест кардан?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Шумо боварӣ доред, ки мехоҳед видео-отзыви "{deleteDialog.name}"-ро нест кунед? Ин амал бозгашт надорад.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-200">
                Бекор кардан
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteReview}
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

export default Otziv;
