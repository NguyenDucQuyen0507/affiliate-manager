"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveDeal, updateDeal } from "@/app/dashboard/deals/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buildCaptionTemplate } from "@/lib/deal-caption";
import { formatShortDate, formatTime, nowInAppTimeZone } from "@/lib/format";
import { recallDealTargets, rememberDealTargets } from "@/lib/last-deal-targets";
import {
  dealFormSchema,
  getDealFormDefaults,
  type DealFormValues,
  type DealIntent,
} from "@/lib/deal-schema";
import { detectMarketplace } from "@/lib/labels";
import type { Channel, Deal, PostStatus } from "@/lib/types";
import { ChannelTargets } from "./channel-targets";
import { DeleteDealButton } from "./delete-deal-button";
import { DealPreview } from "./deal-preview";
import { ImagePicker, type EditorImage } from "./image-picker";
import { PriceInput } from "./price-input";

const sectionClass = "gap-[18px] p-4 sm:p-6";
const sectionTitleClass = "font-heading text-lg font-semibold";

export function DealEditor({
  deal,
  channels,
  categories,
}: {
  deal: Deal | null;
  channels: Channel[];
  /** Categories already in use, suggested in the "Danh mục" field. */
  categories: string[];
}) {
  const isEdit = deal !== null;
  const router = useRouter();
  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: getDealFormDefaults(channels, deal),
  });
  const { control, formState } = form;
  const [images, setImages] = useState<EditorImage[]>(
    () => deal?.imageUrls.map((url) => ({ id: url, url, uploading: false })) ?? [],
  );
  const [submitting, setSubmitting] = useState<DealIntent | null>(null);

  // New deal: preselect the channels and times used for the last deal created in
  // this browser. After mount, because localStorage does not exist on the server.
  useEffect(() => {
    if (isEdit) return;
    const recalled = recallDealTargets(form.getValues("targets"));
    if (!recalled) return;
    form.setValue("targets", recalled.targets);
    form.setValue("showOnBio", recalled.showOnBio);
  }, [isEdit, form]);

  const postStatusByChannel: Record<string, PostStatus> = Object.fromEntries(
    deal?.posts.map((post) => [post.channelId, post.status]) ?? [],
  );

  function submit(intent: DealIntent) {
    if (images.some((image) => image.uploading)) {
      toast.info("Ảnh đang được tải lên, vui lòng đợi vài giây rồi lưu lại.");
      return;
    }
    form.setValue("intent", intent);
    void form.handleSubmit(
      async (values) => {
        setSubmitting(intent);
        try {
          const imageUrls = images.map((image) => image.url);
          const result = deal
            ? await updateDeal(deal.id, values, imageUrls)
            : await saveDeal(values, imageUrls);
          if (result.ok) {
            if (intent === "publish") {
              toast.success("Đã lưu deal và đưa bài vào hàng đợi đăng ngay", {
                description: `${result.publishedNow} bài sẽ được đăng trong lượt kiểm tra hàng đợi kế tiếp.`,
              });
            } else {
              toast.success("Đã lưu deal", {
                description:
                  intent === "draft"
                    ? "Deal đang ở trạng thái nháp, chưa đăng lên kênh nào."
                    : "Các bài đăng đã được đưa vào lịch đăng.",
              });
            }
            if (!isEdit && intent !== "draft") rememberDealTargets(values);
            if (isEdit) {
              form.reset(intent === "publish" ? withPublishedNow(values) : values);
              router.refresh();
            } else {
              // Keep editing the saved deal, so saving again does not create a duplicate.
              router.replace(`/dashboard/deals/${result.dealId}`);
            }
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

  function generateCaption() {
    const values = form.getValues();
    const caption = buildCaptionTemplate({
      title: values.title,
      price: values.price,
      originalPrice: values.originalPrice,
      expiresAt: values.expiresAt || null,
      searchCode: values.searchCode || null,
      marketplace: detectMarketplace(values.affiliateUrl),
    });
    const previous = values.caption;
    const setCaption = (value: string) =>
      form.setValue("caption", value, { shouldDirty: true, shouldValidate: formState.isSubmitted });
    setCaption(caption);
    form.setFocus("caption");
    if (previous.trim() && previous !== caption) {
      toast.info("Đã thay caption cũ bằng caption mới", {
        action: { label: "Hoàn tác", onClick: () => setCaption(previous) },
      });
    }
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
            {deal && <DeleteDealButton dealId={deal.id} disabled={busy} />}
            <Button type="button" variant="outline" size="touch" disabled={busy} onClick={() => submit("draft")}>
              {submitting === "draft" && <Loader2 className="animate-spin" aria-hidden="true" />}
              Lưu nháp
            </Button>
            <Button type="button" variant="soft" size="touch" disabled={busy} onClick={() => submit("publish")}>
              {submitting === "publish" && <Loader2 className="animate-spin" aria-hidden="true" />}
              Lưu & đăng ngay
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
                    <Input
                      {...field}
                      id="deal-url"
                      type="url"
                      placeholder="https://s.shopee.vn/..."
                      autoComplete="off"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                    <FieldDescription>
                      Link Shopee bắt đầu bằng https://s.shopee.vn/ hoặc https://shope.ee/. Cũng nhận link TikTok Shop và Lazada.
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
                  name="category"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
                      <FieldLabel htmlFor="deal-category">Danh mục</FieldLabel>
                      <Input
                        {...field}
                        id="deal-category"
                        list="deal-category-options"
                        autoComplete="off"
                        placeholder="VD: Mẹ và bé"
                        aria-invalid={fieldState.invalid}
                      />
                      <datalist id="deal-category-options">
                        {categories.map((category) => (
                          <option key={category} value={category} />
                        ))}
                      </datalist>
                      <FieldError errors={[fieldState.error]} />
                      <FieldDescription>Dùng để lọc deal trên trang Bio.</FieldDescription>
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
                      {deal?.priceCheckedAt && (
                        <FieldDescription>
                          Giá cập nhật lúc {formatTime(deal.priceCheckedAt)} ngày {formatShortDate(deal.priceCheckedAt)}
                        </FieldDescription>
                      )}
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
                <ImagePicker images={images} setImages={setImages} />
              </div>
            </Card>

            {/* 2. Post content */}
            <Card role="region" aria-labelledby="deal-s2" className={sectionClass}>
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <h2 id="deal-s2" className={sectionTitleClass}>
                  2. Nội dung bài đăng
                </h2>
                <Button type="button" variant="outline" size="row" onClick={generateCaption}>
                  Tạo caption
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
              <Controller
                name="note"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="deal-note">Nhận xét của mình (tùy chọn)</FieldLabel>
                    <Textarea
                      {...field}
                      id="deal-note"
                      rows={2}
                      maxLength={280}
                      placeholder="VD: Vải dày, không xuyên. Bạn dưới 50kg lấy size S nhé."
                      className="min-h-[72px] resize-y"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                    <FieldDescription>
                      Chỉ hiện trên trang Bio, không đăng lên Facebook hay Telegram. Tối đa 280 ký tự.
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
            />
          </Card>
        </div>
      </form>
    </FormProvider>
  );
}

/** Form values after "Lưu & đăng ngay": the chosen, unsent channels now show the current time. */
function withPublishedNow(values: DealFormValues): DealFormValues {
  const now = nowInAppTimeZone().dateTime;
  return {
    ...values,
    targets: values.targets.map((target) =>
      target.enabled && !target.locked ? { ...target, scheduledAt: now } : target,
    ),
  };
}
