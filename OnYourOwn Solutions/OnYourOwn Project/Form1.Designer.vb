<Global.Microsoft.VisualBasic.CompilerServices.DesignerGenerated()> _
Partial Class Form1
    Inherits System.Windows.Forms.Form

    'Form overrides dispose to clean up the component list.
    <System.Diagnostics.DebuggerNonUserCode()> _
    Protected Overrides Sub Dispose(ByVal disposing As Boolean)
        Try
            If disposing AndAlso components IsNot Nothing Then
                components.Dispose()
            End If
        Finally
            MyBase.Dispose(disposing)
        End Try
    End Sub

    'Required by the Windows Form Designer
    Private components As System.ComponentModel.IContainer

    'NOTE: The following procedure is required by the Windows Form Designer
    'It can be modified using the Windows Form Designer.  
    'Do not modify it using the code editor.
    <System.Diagnostics.DebuggerStepThrough()> _
    Private Sub InitializeComponent()
        Me.imgHearts = New System.Windows.Forms.PictureBox()
        Me.imgSkull = New System.Windows.Forms.PictureBox()
        Me.btnCLose = New System.Windows.Forms.Button()
        Me.lblMain = New System.Windows.Forms.Label()
        CType(Me.imgHearts, System.ComponentModel.ISupportInitialize).BeginInit()
        CType(Me.imgSkull, System.ComponentModel.ISupportInitialize).BeginInit()
        Me.SuspendLayout()
        '
        'imgHearts
        '
        Me.imgHearts.Image = Global.OnYourOwn_Project.My.Resources.Resources.Icon_Regeneration
        Me.imgHearts.Location = New System.Drawing.Point(316, 50)
        Me.imgHearts.Name = "imgHearts"
        Me.imgHearts.Size = New System.Drawing.Size(100, 98)
        Me.imgHearts.SizeMode = System.Windows.Forms.PictureBoxSizeMode.CenterImage
        Me.imgHearts.TabIndex = 2
        Me.imgHearts.TabStop = False
        '
        'imgSkull
        '
        Me.imgSkull.Image = Global.OnYourOwn_Project.My.Resources.Resources.Icon_Poison
        Me.imgSkull.Location = New System.Drawing.Point(104, 50)
        Me.imgSkull.Name = "imgSkull"
        Me.imgSkull.Size = New System.Drawing.Size(100, 98)
        Me.imgSkull.SizeMode = System.Windows.Forms.PictureBoxSizeMode.CenterImage
        Me.imgSkull.TabIndex = 0
        Me.imgSkull.TabStop = False
        '
        'btnCLose
        '
        Me.btnCLose.Location = New System.Drawing.Point(199, 187)
        Me.btnCLose.Name = "btnCLose"
        Me.btnCLose.Size = New System.Drawing.Size(75, 23)
        Me.btnCLose.TabIndex = 3
        Me.btnCLose.Text = "&Close"
        Me.btnCLose.UseVisualStyleBackColor = True
        '
        'lblMain
        '
        Me.lblMain.Font = New System.Drawing.Font("Microsoft Sans Serif", 9.75!, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, CType(0, Byte))
        Me.lblMain.Location = New System.Drawing.Point(59, 252)
        Me.lblMain.Name = "lblMain"
        Me.lblMain.Size = New System.Drawing.Size(482, 140)
        Me.lblMain.TabIndex = 4
        Me.lblMain.TextAlign = System.Drawing.ContentAlignment.MiddleCenter
        '
        'Form1
        '
        Me.AutoScaleDimensions = New System.Drawing.SizeF(6.0!, 13.0!)
        Me.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font
        Me.ClientSize = New System.Drawing.Size(800, 450)
        Me.Controls.Add(Me.lblMain)
        Me.Controls.Add(Me.btnCLose)
        Me.Controls.Add(Me.imgHearts)
        Me.Controls.Add(Me.imgSkull)
        Me.Name = "Form1"
        Me.Text = "Form1"
        CType(Me.imgHearts, System.ComponentModel.ISupportInitialize).EndInit()
        CType(Me.imgSkull, System.ComponentModel.ISupportInitialize).EndInit()
        Me.ResumeLayout(False)

    End Sub

    Friend WithEvents imgSkull As PictureBox
    Friend WithEvents imgHearts As PictureBox
    Friend WithEvents btnCLose As Button
    Friend WithEvents lblMain As Label
End Class
