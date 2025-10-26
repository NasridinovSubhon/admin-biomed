import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { adminDataStore } from '@/app/zustand';
import { Plus, Edit, Trash2, X, MapPin, Calendar, Building2, Phone, Clock, ExternalLink } from 'lucide-react';
import { toast } from "sonner";

const Filial = () => {
  const { getDataFilial, dataFilial, postFilial, updateFilial, deleteFilial } = adminDataStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: "" });
  const [editingFilial, setEditingFilial] = useState(null);

  const [newFilial, setNewFilial] = useState({
    name: "",
    year: new Date().getFullYear(),
    adres: "",
    phone: "",
    workHours: "Пн-Пт: 8:00-18:00, Сб: 9:00-16:00, Вс: выходной",
    image: "",
    coordinates: {
      lat: 0,
      lng: 0
    }
  });

  useEffect(() => {
    const loadData = async () => {
      await getDataFilial();
      setIsLoading(false);
    };
    loadData();
  }, [getDataFilial]);

  // Функция для открытия Google Maps
  const openGoogleMaps = (filial) => {
    if (filial.coordinates && filial.coordinates.lat && filial.coordinates.lng) {
      const { lat, lng } = filial.coordinates;
      const url = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(url, '_blank');
    } else {
      // Если координат нет, открываем поиск по адресу
      const query = encodeURIComponent(filial.adres);
      const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
      window.open(url, '_blank');
    }
  };

  // Обработчик добавления нового филиала
  const handleAddFilial = async (e) => {
    e.preventDefault();

    if (!newFilial.name || !newFilial.adres) {
      toast.error("Лутфан ҳамаи майдонҳои зарурӣ пур кунед");
      return;
    }

    toast.promise(
      async () => {
        await postFilial(newFilial);
        setShowAddForm(false);
        setNewFilial({
          name: "",
          year: new Date().getFullYear(),
          adres: "",
          phone: "",
          workHours: "Пн-Пт: 8:00-18:00, Сб: 9:00-16:00, Вс: выходной",
          image: "",
          coordinates: {
            lat: 0,
            lng: 0
          }
        });
      },
      {
        loading: "Илова кардани филиал...",
        success: "Филиал бомуваффақият илова шуд!",
        error: "Хатоги дар илова кардани филиал"
      }
    );
  };

  // Обработчик редактирования филиала
  const handleEditFilial = async (e) => {
    e.preventDefault();

    if (!editingFilial?.name || !editingFilial?.adres) {
      toast.error("Лутфан ҳамаи майдонҳои зарурӣ пур кунед");
      return;
    }

    toast.promise(
      async () => {
        await updateFilial(editingFilial.id, {
          name: editingFilial.name,
          year: editingFilial.year,
          adres: editingFilial.adres,
          phone: editingFilial.phone,
          workHours: editingFilial.workHours,
          image: editingFilial.image,
          coordinates: editingFilial.coordinates
        });
        setShowEditForm(false);
        setEditingFilial(null);
      },
      {
        loading: "Таҳрир кардани филиал...",
        success: "Филиал бомуваффақият таҳрир шуд!",
        error: "Хатоги дар таҳрир кардани филиал"
      }
    );
  };

  // Обработчик удаления филиала
  const handleDeleteFilial = async () => {
    toast.promise(
      async () => {
        await deleteFilial(deleteDialog.id);
        setDeleteDialog({ open: false, id: null, name: "" });
      },
      {
        loading: "Нест кардани филиал...",
        success: "Филиал бомуваффақият нест шуд!",
        error: "Хатоги дар нест кардани филиал"
      }
    );
  };

  // Функция для открытия формы редактирования
  const openEditForm = (filial) => {
    setEditingFilial(filial);
    setShowEditForm(true);
  };

  // Функция для открытия диалога удаления
  const openDeleteDialog = (filial) => {
    setDeleteDialog({
      open: true,
      id: filial.id,
      name: filial.name
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
    <div className="min-h-screen bg-transparent p-6">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок с кнопкой добавления */}
        <div className="text-center mb-16 flex items-center justify-between">

          <h1 className="text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Филиалҳои мо
          </h1>


          {/* Кнопка добавления */}
          <Button
            onClick={() => setShowAddForm(true)}
            className="rounded-xl bg-primary/90 hover:bg-primary backdrop-blur-sm border border-primary/20 shadow-lg transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Илова кардани филиал
          </Button>
        </div>

        {/* Сетка карточек филиалов */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : dataFilial.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex flex-col items-center justify-center">
              <div className="p-6 rounded-2xl bg-muted/30 backdrop-blur-sm border border-border/40 mb-6">
                <Building2 className="w-16 h-16 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Филиалҳо пайдо нашуд</h3>
              <p className="text-muted-foreground text-lg">Ягон филиал пайдо нашуд</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataFilial.map((filial) => (
              <Card
                key={filial.id}
                className="group overflow-hidden p-0 pb-4 bg-background/60 backdrop-blur-sm border-border/40 rounded-2xl transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] cursor-pointer hover:bg-background/70 border relative"
              >
                {/* Кнопки действий */}
                <div className="absolute top-4 right-4 z-10 flex gap-2 group-hover:opacity-100 transition-opacity duration-300">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditForm(filial);
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
                      openDeleteDialog(filial);
                    }}
                    className="h-8 w-8 p-0 rounded-lg bg-background/80 backdrop-blur-sm border border-border/40 hover:bg-red-500/20 hover:border-red-300/50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Изображение филиала */}
                <div
                  className="w-full h-48 overflow-hidden relative cursor-pointer"
                  onClick={() => openGoogleMaps(filial)}
                >
                  <img
                    src={filial.image || "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop"}
                    alt={filial.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" />
                      <span>Нигоҳ кардан дар харита</span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors duration-300">
                      {filial.name}
                    </CardTitle>
                    
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Аз соли {filial.year}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {filial.adres}
                      </p>
                    </div>

                    {filial.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{filial.phone}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {filial.workHours || "Пн-Пт: 8:00-18:00, Сб: 9:00-16:00, Вс: выходной"}
                      </span>
                    </div>
                  </div>

                  {/* Кнопка для открытия карты */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openGoogleMaps(filial)}
                    className="w-full rounded-xl bg-background/50 backdrop-blur-sm border-border/40 hover:bg-green-500/20 hover:border-green-300/50 transition-all duration-300 group/map"
                  >
                    <MapPin className="h-4 w-4 mr-2 group-hover/map:scale-110 transition-transform duration-300" />
                    Нигоҳ кардан дар Google Maps
                  </Button>
                </CardContent>

                {/* Акцентная полоса */}
                <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-primary to-primary/50 group-hover:w-full transition-all duration-500"></div>
              </Card>
            ))}
          </div>
        )}

        {/* Модальное окно добавления филиала */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-border/50 rounded-2xl max-h-[95vh] overflow-y-auto  scrollbar-thumb-transparent scrollbar-track-transparent   custom-scroll   ">
            <DialogHeader className="border-b border-border/30 pb-4">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Илова кардани филиали нав
              </DialogTitle>
              <DialogDescription>
                Маълумоти филиали навро ворид кунед
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddFilial} className="space-y-6 py-2">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-medium text-foreground/80">
                  Номи филиал *
                </Label>
                <Input
                  id="name"
                  required
                  value={newFilial.name}
                  onChange={(e) => setNewFilial({ ...newFilial, name: e.target.value })}
                  placeholder="Biomeda Душанбе - Центральный филиал"
                  className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="year" className="text-sm font-medium text-foreground/80">
                  Соли таъсис *
                </Label>
                <Input
                  id="year"
                  type="number"
                  required
                  min="1900"
                  max="2100"
                  value={newFilial.year}
                  onChange={(e) => setNewFilial({ ...newFilial, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="adres" className="text-sm font-medium text-foreground/80">
                  Суроға *
                </Label>
                <Textarea
                  id="adres"
                  required
                  value={newFilial.adres}
                  onChange={(e) => setNewFilial({ ...newFilial, adres: e.target.value })}
                  placeholder="г. Душанбе, проспект Рудаки 44, Бизнес-центр 'Душанбе Плаза'"
                  className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 min-h-[80px]"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="phone" className="text-sm font-medium text-foreground/80">
                  Рақами телефон
                </Label>
                <Input
                  id="phone"
                  value={newFilial.phone}
                  onChange={(e) => setNewFilial({ ...newFilial, phone: e.target.value })}
                  placeholder="+992 (44) 600-00-00"
                  className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="workHours" className="text-sm font-medium text-foreground/80">
                  Соатҳои корӣ
                </Label>
                <Input
                  id="workHours"
                  value={newFilial.workHours}
                  onChange={(e) => setNewFilial({ ...newFilial, workHours: e.target.value })}
                  placeholder="Пн-Пт: 8:00-18:00, Сб: 9:00-16:00, Вс: выходной"
                  className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="image" className="text-sm font-medium text-foreground/80">
                  URL-и сурат
                </Label>
                <Input
                  id="image"
                  value={newFilial.image}
                  onChange={(e) => setNewFilial({ ...newFilial, image: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="lat" className="text-sm font-medium text-foreground/80">
                    Latitude
                  </Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={newFilial.coordinates.lat}
                    onChange={(e) => setNewFilial({
                      ...newFilial,
                      coordinates: {
                        ...newFilial.coordinates,
                        lat: parseFloat(e.target.value) || 0
                      }
                    })}
                    placeholder="38.559772"
                    className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="lng" className="text-sm font-medium text-foreground/80">
                    Longitude
                  </Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    value={newFilial.coordinates.lng}
                    onChange={(e) => setNewFilial({
                      ...newFilial,
                      coordinates: {
                        ...newFilial.coordinates,
                        lng: parseFloat(e.target.value) || 0
                      }
                    })}
                    placeholder="68.773859"
                    className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-border/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewFilial({
                      name: "",
                      year: new Date().getFullYear(),
                      adres: "",
                      phone: "",
                      workHours: "Пн-Пт: 8:00-18:00, Сб: 9:00-16:00, Вс: выходной",
                      image: "",
                      coordinates: {
                        lat: 0,
                        lng: 0
                      }
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

        {/* Модальное окно редактирования филиала */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-border/50 rounded-2xl max-h-[95vh] overflow-y-auto  scrollbar-thumb-transparent scrollbar-track-transparent   custom-scroll   ">
            <DialogHeader className="border-b border-border/30 pb-4">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Таҳрир кардани филиал
              </DialogTitle>
              <DialogDescription>
                Маълумоти филиалро таҳрир кунед
              </DialogDescription>
            </DialogHeader>
            {editingFilial && (
              <form onSubmit={handleEditFilial} className="space-y-6 py-2">
                <div className="space-y-3">
                  <Label htmlFor="edit-name" className="text-sm font-medium text-foreground/80">
                    Номи филиал *
                  </Label>
                  <Input
                    id="edit-name"
                    required
                    value={editingFilial.name}
                    onChange={(e) => setEditingFilial({ ...editingFilial, name: e.target.value })}
                    className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-year" className="text-sm font-medium text-foreground/80">
                    Соли таъсис *
                  </Label>
                  <Input
                    id="edit-year"
                    type="number"
                    required
                    min="1900"
                    max="2100"
                    value={editingFilial.year}
                    onChange={(e) => setEditingFilial({ ...editingFilial, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-adres" className="text-sm font-medium text-foreground/80">
                    Суроға *
                  </Label>
                  <Textarea
                    id="edit-adres"
                    required
                    value={editingFilial.adres}
                    onChange={(e) => setEditingFilial({ ...editingFilial, adres: e.target.value })}
                    className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 min-h-[80px]"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-phone" className="text-sm font-medium text-foreground/80">
                    Рақами телефон
                  </Label>
                  <Input
                    id="edit-phone"
                    value={editingFilial.phone || ''}
                    onChange={(e) => setEditingFilial({ ...editingFilial, phone: e.target.value })}
                    className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-workHours" className="text-sm font-medium text-foreground/80">
                    Соатҳои корӣ
                  </Label>
                  <Input
                    id="edit-workHours"
                    value={editingFilial.workHours || ''}
                    onChange={(e) => setEditingFilial({ ...editingFilial, workHours: e.target.value })}
                    className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="edit-image" className="text-sm font-medium text-foreground/80">
                    URL-и сурат
                  </Label>
                  <Input
                    id="edit-image"
                    value={editingFilial.image || ''}
                    onChange={(e) => setEditingFilial({ ...editingFilial, image: e.target.value })}
                    className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="edit-lat" className="text-sm font-medium text-foreground/80">
                      Latitude
                    </Label>
                    <Input
                      id="edit-lat"
                      type="number"
                      step="any"
                      value={editingFilial.coordinates?.lat || 0}
                      onChange={(e) => setEditingFilial({
                        ...editingFilial,
                        coordinates: {
                          ...editingFilial.coordinates,
                          lat: parseFloat(e.target.value) || 0
                        }
                      })}
                      className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="edit-lng" className="text-sm font-medium text-foreground/80">
                      Longitude
                    </Label>
                    <Input
                      id="edit-lng"
                      type="number"
                      step="any"
                      value={editingFilial.coordinates?.lng || 0}
                      onChange={(e) => setEditingFilial({
                        ...editingFilial,
                        coordinates: {
                          ...editingFilial.coordinates,
                          lng: parseFloat(e.target.value) || 0
                        }
                      })}
                      className="rounded-xl bg-background/50 backdrop-blur-sm border-border/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-border/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingFilial(null);
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
                Филиалро нест кардан?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Шумо боварӣ доред, ки мехоҳед филиали "{deleteDialog.name}"-ро нест кунед? Ин амал бозгашт надорад.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-200">
                Бекор кардан
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteFilial}
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

export default Filial;
