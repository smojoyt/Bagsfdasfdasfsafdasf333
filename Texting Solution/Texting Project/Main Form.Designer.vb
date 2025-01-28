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
        Me.picXO = New System.Windows.Forms.PictureBox()
        Me.picSRY = New System.Windows.Forms.PictureBox()
        Me.picIDK = New System.Windows.Forms.PictureBox()
        Me.picLOL = New System.Windows.Forms.PictureBox()
        Me.picBRB = New System.Windows.Forms.PictureBox()
        Me.picBFF = New System.Windows.Forms.PictureBox()
        Me.lblMeaning = New System.Windows.Forms.Label()
        Me.btnExit = New System.Windows.Forms.Button()
        CType(Me.picXO, System.ComponentModel.ISupportInitialize).BeginInit()
        CType(Me.picSRY, System.ComponentModel.ISupportInitialize).BeginInit()
        CType(Me.picIDK, System.ComponentModel.ISupportInitialize).BeginInit()
        CType(Me.picLOL, System.ComponentModel.ISupportInitialize).BeginInit()
        CType(Me.picBRB, System.ComponentModel.ISupportInitialize).BeginInit()
        CType(Me.picBFF, System.ComponentModel.ISupportInitialize).BeginInit()
        Me.SuspendLayout()
        '
        'picXO
        '
        Me.picXO.Image = Global.Texting_Project.My.Resources.Resources.XO
        Me.picXO.Location = New System.Drawing.Point(567, 60)
        Me.picXO.Name = "picXO"
        Me.picXO.Size = New System.Drawing.Size(100, 50)
        Me.picXO.TabIndex = 5
        Me.picXO.TabStop = False
        '
        'picSRY
        '
        Me.picSRY.Image = Global.Texting_Project.My.Resources.Resources.SRY
        Me.picSRY.Location = New System.Drawing.Point(461, 60)
        Me.picSRY.Name = "picSRY"
        Me.picSRY.Size = New System.Drawing.Size(100, 50)
        Me.picSRY.TabIndex = 4
        Me.picSRY.TabStop = False
        '
        'picIDK
        '
        Me.picIDK.Image = Global.Texting_Project.My.Resources.Resources.IDK
        Me.picIDK.Location = New System.Drawing.Point(249, 60)
        Me.picIDK.Name = "picIDK"
        Me.picIDK.Size = New System.Drawing.Size(100, 50)
        Me.picIDK.TabIndex = 3
        Me.picIDK.TabStop = False
        '
        'picLOL
        '
        Me.picLOL.Image = Global.Texting_Project.My.Resources.Resources.LOL
        Me.picLOL.Location = New System.Drawing.Point(355, 60)
        Me.picLOL.Name = "picLOL"
        Me.picLOL.Size = New System.Drawing.Size(100, 50)
        Me.picLOL.TabIndex = 2
        Me.picLOL.TabStop = False
        '
        'picBRB
        '
        Me.picBRB.Image = Global.Texting_Project.My.Resources.Resources.BRB
        Me.picBRB.Location = New System.Drawing.Point(143, 60)
        Me.picBRB.Name = "picBRB"
        Me.picBRB.Size = New System.Drawing.Size(100, 50)
        Me.picBRB.TabIndex = 1
        Me.picBRB.TabStop = False
        '
        'picBFF
        '
        Me.picBFF.Image = Global.Texting_Project.My.Resources.Resources.BFF
        Me.picBFF.Location = New System.Drawing.Point(37, 60)
        Me.picBFF.Name = "picBFF"
        Me.picBFF.Size = New System.Drawing.Size(100, 50)
        Me.picBFF.TabIndex = 0
        Me.picBFF.TabStop = False
        '
        'lblMeaning
        '
        Me.lblMeaning.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle
        Me.lblMeaning.Font = New System.Drawing.Font("Segoe UI", 18.0!, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, CType(0, Byte))
        Me.lblMeaning.Location = New System.Drawing.Point(37, 334)
        Me.lblMeaning.Name = "lblMeaning"
        Me.lblMeaning.Size = New System.Drawing.Size(630, 85)
        Me.lblMeaning.TabIndex = 6
        Me.lblMeaning.TextAlign = System.Drawing.ContentAlignment.MiddleCenter
        '
        'btnExit
        '
        Me.btnExit.Location = New System.Drawing.Point(738, 393)
        Me.btnExit.Name = "btnExit"
        Me.btnExit.Size = New System.Drawing.Size(75, 23)
        Me.btnExit.TabIndex = 7
        Me.btnExit.Text = "E&xit"
        Me.btnExit.UseVisualStyleBackColor = True
        '
        'Form1
        '
        Me.AutoScaleDimensions = New System.Drawing.SizeF(7.0!, 15.0!)
        Me.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font
        Me.ClientSize = New System.Drawing.Size(933, 519)
        Me.Controls.Add(Me.btnExit)
        Me.Controls.Add(Me.lblMeaning)
        Me.Controls.Add(Me.picXO)
        Me.Controls.Add(Me.picSRY)
        Me.Controls.Add(Me.picIDK)
        Me.Controls.Add(Me.picLOL)
        Me.Controls.Add(Me.picBRB)
        Me.Controls.Add(Me.picBFF)
        Me.Font = New System.Drawing.Font("Segoe UI", 9.0!, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, CType(0, Byte))
        Me.Margin = New System.Windows.Forms.Padding(4, 3, 4, 3)
        Me.MaximizeBox = False
        Me.Name = "Form1"
        Me.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen
        Me.Text = "Text Message Symbols"
        CType(Me.picXO, System.ComponentModel.ISupportInitialize).EndInit()
        CType(Me.picSRY, System.ComponentModel.ISupportInitialize).EndInit()
        CType(Me.picIDK, System.ComponentModel.ISupportInitialize).EndInit()
        CType(Me.picLOL, System.ComponentModel.ISupportInitialize).EndInit()
        CType(Me.picBRB, System.ComponentModel.ISupportInitialize).EndInit()
        CType(Me.picBFF, System.ComponentModel.ISupportInitialize).EndInit()
        Me.ResumeLayout(False)

    End Sub

    Friend WithEvents picBFF As PictureBox
    Friend WithEvents picBRB As PictureBox
    Friend WithEvents picLOL As PictureBox
    Friend WithEvents picIDK As PictureBox
    Friend WithEvents picSRY As PictureBox
    Friend WithEvents picXO As PictureBox
    Friend WithEvents lblMeaning As Label
    Friend WithEvents btnExit As Button
End Class
