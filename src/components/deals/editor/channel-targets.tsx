"use client";

import { Controller, useController, useFormContext, useFormState, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { DealFormValues } from "@/lib/deal-schema";
import { formatScheduleLabel } from "@/lib/format";
import { channelDisplayName } from "@/lib/labels";
import { channelStatusMeta, postStatusMeta } from "@/lib/status";
import type { Channel, PostStatus } from "@/lib/types";

const rowClass =
  "grid gap-3 rounded-lg border px-3.5 py-3 transition-colors sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center";
const rowCheckedClass = "border-primary-soft-border bg-primary-soft";

export function ChannelTargets({
  channels,
  postStatusByChannel,
}: {
  channels: Channel[];
  /** Status of posts that already exist for this deal (edit mode). */
  postStatusByChannel: Record<string, PostStatus>;
}) {
  const { errors } = useFormState<DealFormValues>({ name: "targets" });
  const rootError = errors.targets?.root ?? errors.targets;

  return (
    <div className="flex flex-col gap-3.5">
      {channels.map((channel, index) => (
        <ChannelTargetRow
          key={channel.id}
          index={index}
          channel={channel}
          postStatus={postStatusByChannel[channel.id]}
        />
      ))}
      <BioRow />
      <FieldError errors={rootError?.message ? [rootError] : undefined} />
    </div>
  );
}

function ChannelTargetRow({
  index,
  channel,
  postStatus,
}: {
  index: number;
  channel: Channel;
  postStatus?: PostStatus;
}) {
  const { control, getValues, setValue } = useFormContext<DealFormValues>();
  const enabled = useController({ control, name: `targets.${index}.enabled` });
  const scheduledAtValue = useWatch({ control, name: `targets.${index}.scheduledAt` });
  const locked = getValues(`targets.${index}.locked`);

  const name = channelDisplayName(channel);
  const checkboxId = `target-${channel.id}`;
  const checked = enabled.field.value;

  function toggle(next: boolean) {
    enabled.field.onChange(next);
    // Reuse the time already picked for another channel, so posting everywhere
    // at once only needs one time entry.
    if (next && !getValues(`targets.${index}.scheduledAt`)) {
      const other = getValues("targets").find((t) => t.enabled && t.scheduledAt);
      if (other) setValue(`targets.${index}.scheduledAt`, other.scheduledAt, { shouldDirty: true });
    }
  }

  return (
    <div className={cn(rowClass, checked && rowCheckedClass)}>
      <div className="flex min-h-11 flex-wrap items-center gap-x-2.5 gap-y-1">
        <Checkbox
          id={checkboxId}
          checked={checked}
          disabled={locked}
          onCheckedChange={(value) => toggle(value === true)}
        />
        <label
          htmlFor={checkboxId}
          className={cn("text-sm", checked ? "font-semibold" : "font-medium")}
        >
          {name}
        </label>
        {channel.status !== "ACTIVE" && (
          <Badge variant={channelStatusMeta[channel.status].variant}>
            {channelStatusMeta[channel.status].label}
          </Badge>
        )}
        {/* Pending is implied by a checked row with a time; only surface final states. */}
        {postStatus && postStatus !== "PENDING" && (
          <Badge variant={postStatusMeta[postStatus].variant}>
            {postStatusMeta[postStatus].label}
          </Badge>
        )}
      </div>

      {!checked ? (
        <span className="text-[13px] text-subtle">Chưa chọn</span>
      ) : locked ? (
        <span className="text-[13px] text-muted-foreground">
          Đã đăng {formatScheduleLabel(scheduledAtValue, null)}
        </span>
      ) : (
        <Controller
          name={`targets.${index}.scheduledAt`}
          control={control}
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1">
              <Input
                {...field}
                type="datetime-local"
                aria-label={`Giờ đăng lên ${name}`}
                aria-invalid={fieldState.invalid}
                className="px-2.5"
              />
              <FieldError errors={[fieldState.error]} />
            </div>
          )}
        />
      )}
    </div>
  );
}

function BioRow() {
  const { control } = useFormContext<DealFormValues>();
  const { field } = useController({ control, name: "showOnBio" });

  return (
    <div className={cn(rowClass, field.value && rowCheckedClass)}>
      <div className="flex min-h-11 items-center gap-2.5">
        <Checkbox
          id="target-bio"
          checked={field.value}
          onCheckedChange={(value) => field.onChange(value === true)}
        />
        <label
          htmlFor="target-bio"
          className={cn("text-sm", field.value ? "font-semibold" : "font-medium")}
        >
          Hiện trên trang Bio link
        </label>
      </div>
      <span className={cn("text-[13px]", field.value ? "text-muted-foreground" : "text-subtle")}>
        {field.value ? "Hiện ngay khi lưu" : "Chưa chọn"}
      </span>
    </div>
  );
}
