"use client";

import { useState } from "react";
import Link from "next/link";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveDeal } from "@/app/dashboard/deals/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buildCaptionTemplate } from "@/lib/deal-caption";
import {
  dealFormSchema,
  getDealFormDefaults,
  type DealFormValues,
  type DealIntent,
} from "@/lib/deal-schema";
import { detectMarketplace, marketplaceLabel } from "@/lib/labels";
import type { Channel, Deal, PostStatus } from "@/lib/types";
import { ChannelTargets } from "./channel-targets";
import { DealPreview } from "./deal-preview";
import { ImagePicker, type EditorImage } from "./image-picker";
import { PriceInput } from "./price-input";

const sectionClass = "gap-[18px] p-4 sm:p-6";
const sectionTitleClass = "font-heading text-lg font-semibold";

export function DealEditor({ deal, channels }: { deal: Deal | null; channels: Channel[] }) {
  const isEdit = deal !== null;
  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: getDealFormDefaults(channels, deal),
  });
  const { control, formState } = form;
  const [images, setImages] = useState<EditorImage[]>(
    () => deal?.imageUrls.map((url) => ({ id: url, url, file: null })) ?? [],
  );
  const [submitting, setSubmitting] = useState<DealIntent | null>(null);

  const postStatusByChannel: Record<string, PostStatus> = Object.fromEntries(
    deal?.posts.map((post) => [post.channelId, post.status]) ?? [],
  );

  function submit(intent: DealIntent) {
    form.setValue("intent", intent);
    void form.handleSubmit(
      async (values) => {
        setSubmitting(intent);
        try {
          const result = await saveDeal(deal?.id ?? null, values);
          if (result.ok) {
            toast.success(intent === "draft" ? "Đã lưu nháp" : "Đã lên lịch đăng");
            form.reset(values);
          } else {
            toast.error(result.message);
          }
        } catch {
          toast.error("Không lưu được deal. Vui lòng thử lại.");
        } finally {
          setSubmitting(null);
        }
      },
      () => toast.error("Vui lòng kiểm tra lại các ô báo lỗi"),
    )();
  }

  function fetchProductInfo() {
    const url = form.getValues("affiliateUrl").trim();
    const marketplace = detectMarketplace(url);
    if (!marketplace) {
      form.setError("affiliateUrl", {
        message: "Link phải là link Shopee, TikTok Shop hoặc Lazada",
      });
      return;
    }
    form.clearErrors("affiliateUrl");
    // TODO: read name, images and price from the marketplace on the server.
    toast.info(`Đã nhận diện link ${marketplaceLabel[marketplace]}`, {
      description: "Chưa đọc được tên, ảnh và giá tự động. Vui lòng nhập tay.",
    });
  }

  function insertCaptionTemplate() {
    const values = form.getValues();
    const template = buildCaptionTemplate({
      title: values.title,
      price: values.price,
      originalPrice: values.originalPrice,
      expiresAt: values.expiresAt || null,
      searchCode: values.searchCode || null,
      marketplace: detectMarketplace(values.affiliateUrl),
    });
    const current = values.caption.trim();
    form.setValue("caption", current ? `${current}\n\n${template}` : template, {
      shouldDirty: true,
      shouldValidate: formState.isSubmitted,
    });
  }

  const busy = submitting !== null;

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <nav aria-label="Breadcrumb" className="text-[13px] font-semibold text-muted-foreground">
              <Link href="/dashboard/deals" className="hover:text-foreground">
                Deal
              </Link>{" "}
              / {isEdit ? "Chỉnh sửa" : "Tạo mới"}
            </nav>
            <h1 className="font-heading text-[30px] leading-tight font-bold tracking-[-0.01em]">
              {isEdit ? "Sửa deal" : "Tạo deal mới"}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button type="button" variant="outline" size="touch" disabled={busy} onClick={() => submit("draft")}>
              {submitting === "draft" && <Loader2 className="animate-spin" aria-hidden="true" />}
              Lưu nháp
            </Button>
            <Button type="button" size="touch" disabled={busy} onClick={() => submit("schedule")}>
              {submitting === "schedule" && <Loader2 className="animate-spin" aria-hidden="true" />}
              Lên lịch đăng
            </Button>
          </div>
        </header>

        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[3_1_520px] flex-col gap-5">
            {/* 1. Product */}
            <Card role="region" aria-labelledby="deal-s1" className={sectionClass}>
              <h2 id="deal-s1" className={sectionTitleClass}>
                1. Sản phẩm
              </h2>

              <Controller
                name="affiliateUrl"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="deal-url">Link affiliate</FieldLabel>
                    <div className="flex flex-wrap gap-2.5">
                      <Input
                        {...field}
                        id="deal-url"
                        type="url"
                        placeholder="https://s.shopee.vn/..."
                        aria-invalid={fieldState.invalid}
                        className="min-w-0 flex-[1_1_280px]"
                      />
                      <Button type="button" variant="soft" size="touch" className="px-4" onClick={fetchProductInfo}>
                        Lấy thông tin tự động
                      </Button>
                    </div>
                    <FieldError errors={[fieldState.error]} />
                    <FieldDescription>
                      Dán link Shopee, TikTok Shop hoặc Lazada. Hệ thống điền sẵn tên, ảnh và giá nếu đọc được.
                    </FieldDescription>
                  </Field>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Controller
                  name="title"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                      <FieldLabel htmlFor="deal-title">Tên sản phẩm</FieldLabel>
                      <Input {...field} id="deal-title" aria-invalid={fieldState.invalid} />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="price"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="deal-price">Giá khuyến mãi</FieldLabel>
                      <PriceInput
                        id="deal-price"
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="originalPrice"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="deal-original-price">Giá gốc</FieldLabel>
                      <PriceInput
                        id="deal-original-price"
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="searchCode"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="deal-code">Mã tìm kiếm (tùy chọn)</FieldLabel>
                      <Input
                        {...field}
                        id="deal-code"
                        autoComplete="off"
                        onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="expiresAt"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="deal-expires">Hết hạn</FieldLabel>
                      <Input {...field} id="deal-expires" type="date" aria-invalid={fieldState.invalid} />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </div>

              <div role="group" aria-labelledby="deal-images-label" className="flex flex-col gap-1.5">
                <span id="deal-images-label" className="text-sm font-semibold">
                  Ảnh sản phẩm
                </span>
                <ImagePicker images={images} onChange={setImages} />
              </div>
            </Card>

            {/* 2. Post content */}
            <Card role="region" aria-labelledby="deal-s2" className={sectionClass}>
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <h2 id="deal-s2" className={sectionTitleClass}>
                  2. Nội dung bài đăng
                </h2>
                <Button type="button" variant="outline" size="row" onClick={insertCaptionTemplate}>
                  Chèn mẫu caption
                </Button>
              </div>
              <Controller
                name="caption"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="deal-caption">Caption</FieldLabel>
                    <Textarea
                      {...field}
                      id="deal-caption"
                      rows={5}
                      className="min-h-[140px] resize-y"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                    <FieldDescription>
                      Facebook không gắn link trong bài. Link sẽ tự được đăng vào bình luận ghim.
                    </FieldDescription>
                  </Field>
                )}
              />
            </Card>

            {/* 3. Channels & schedule */}
            <Card role="region" aria-labelledby="deal-s3" className="gap-3.5 p-4 sm:p-6">
              <h2 id="deal-s3" className={sectionTitleClass}>
                3. Kênh và thời gian đăng
              </h2>
              <ChannelTargets channels={channels} postStatusByChannel={postStatusByChannel} />
            </Card>
          </div>

          <Card
            role="complementary"
            aria-labelledby="deal-preview"
            className="min-w-0 flex-[2_1_380px] gap-4 p-4 sm:p-6 lg:sticky lg:top-8"
          >
            <h2 id="deal-preview" className={sectionTitleClass}>
              Xem trước
            </h2>
            <DealPreview
              control={control}
              channels={channels}
              images={images}
              placeholderColor={deal?.thumbnailColor ?? null}
            />
          </Card>
        </div>
      </form>
    </FormProvider>
  );
}
